const request = require("supertest");

// Mocks must be declared before requiring ../app (which loads routes)
jest.mock("../services/email.service", () => ({
  sendPasswordResetEmail: jest.fn(),
  sendAddressVerificationEmail: jest.fn(),
}));

jest.mock("../services/notification.service", () => ({
  create: jest.fn(),
}));

jest.mock("../services/sms.service", () => ({
  formatPhoneNumber: jest.fn((p) => `+977${String(p).replace(/\D/g, "")}`),
}));

jest.mock("../middleware/auth", () => ({
  authenticate: (req, _res, next) => {
    req.user = { _id: "user123" };
    next();
  },
  requireAdmin: (_req, _res, next) => next(),
  requireVerified: (_req, _res, next) => next(),
  authorize: () => (_req, _res, next) => next(),
}));

jest.mock("../models/user.model", () => {
  function User(data) {
    Object.assign(this, data);
    this._id = "user123";
    this.verified = false;
    this.save = jest.fn(async () => this);
    this.comparePassword = jest.fn(async () => false);
  }

  User.findOne = jest.fn();
  User.findById = jest.fn();
  return User;
});

jest.mock("../models/passwordReset.model", () => ({
  deleteMany: jest.fn(async () => ({})),
  findOne: jest.fn(async () => null),
}));

jest.mock("../models/phoneVerification.model", () => {
  const m = {
    findOne: jest.fn(),
    find: jest.fn(async () => []),
  };
  // allow chaining `.sort(...)`
  m.findOne.mockReturnValue({ sort: jest.fn(async () => null) });
  m.find.mockReturnValue({ sort: jest.fn(async () => []) });
  return m;
});

describe("auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.useRealTimers();
  });

  function createTestApp() {
    const express = require("express");
    const authRoutes = require("../routes/auth");
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    // minimal error handler to match production behavior
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
      res.status(err.status || 500).json({ error: err.message || "Internal server error" });
    });
    return app;
  }

  describe("POST /api/auth/register", () => {
    test("400 when required fields are missing", async () => {
      const app = createTestApp();
      const res = await request(app).post("/api/auth/register").send({ email: "a@b.com" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    test("400 when email already exists", async () => {
      const User = require("../models/user.model");
      User.findOne.mockResolvedValueOnce({ _id: "u1" }); // email exists
      const app = createTestApp();

      const res = await request(app).post("/api/auth/register").send({
        email: "a@b.com",
        password: "secret123",
        name: "A",
        phone: "9812345678",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already registered/i);
    });

    test("400 when phone already exists", async () => {
      const User = require("../models/user.model");
      // first check: email
      User.findOne.mockResolvedValueOnce(null);
      // second check: phone
      User.findOne.mockResolvedValueOnce({ _id: "u2" });

      const app = createTestApp();
      const res = await request(app).post("/api/auth/register").send({
        email: "new@b.com",
        password: "secret123",
        name: "A",
        phone: "9812345678",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/phone number is already registered/i);
    });

    test("200 returns tempRegistrationId on success", async () => {
      const User = require("../models/user.model");
      User.findOne.mockResolvedValueOnce(null); // email
      User.findOne.mockResolvedValueOnce(null); // phone

      const app = createTestApp();
      const res = await request(app).post("/api/auth/register").send({
        email: "new@b.com",
        password: "secret123",
        name: "A",
        phone: "9812345678",
        role: "sender",
      });
      expect(res.status).toBe(200);
      expect(res.body.tempRegistrationId).toEqual(expect.any(String));
      expect(res.body.phone).toEqual(expect.any(String));
    });
  });

  describe("POST /api/auth/complete-registration", () => {
    test("400 when tempRegistrationId missing", async () => {
      const app = createTestApp();
      const res = await request(app).post("/api/auth/complete-registration").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    test("400 when tempRegistrationId invalid/expired", async () => {
      const app = createTestApp();
      const res = await request(app)
        .post("/api/auth/complete-registration")
        .send({ tempRegistrationId: "does-not-exist" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid|expired/i);
    });

    test("400 when phone not verified", async () => {
      const User = require("../models/user.model");
      const PhoneVerification = require("../models/phoneVerification.model");
      User.findOne.mockResolvedValueOnce(null);
      User.findOne.mockResolvedValueOnce(null);
      PhoneVerification.findOne.mockReturnValueOnce({ sort: jest.fn(async () => null) });

      const app = createTestApp();
      const reg = await request(app).post("/api/auth/register").send({
        email: "x@y.com",
        password: "secret123",
        name: "X",
        phone: "9800000000",
      });

      const res = await request(app)
        .post("/api/auth/complete-registration")
        .send({ tempRegistrationId: reg.body.tempRegistrationId });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not verified/i);
    });

    test("400 when verification is too old", async () => {
      const User = require("../models/user.model");
      const PhoneVerification = require("../models/phoneVerification.model");
      User.findOne.mockResolvedValueOnce(null);
      User.findOne.mockResolvedValueOnce(null);

      const old = new Date(Date.now() - 31 * 60 * 1000);
      const verificationDoc = {
        verified: true,
        createdAt: old,
        save: jest.fn(async () => ({})),
      };
      PhoneVerification.findOne.mockReturnValueOnce({
        sort: jest.fn(async () => verificationDoc),
      });

      const app = createTestApp();
      const reg = await request(app).post("/api/auth/register").send({
        email: "old@y.com",
        password: "secret123",
        name: "Old",
        phone: "9800000001",
      });

      const res = await request(app)
        .post("/api/auth/complete-registration")
        .send({ tempRegistrationId: reg.body.tempRegistrationId });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expired/i);
    });

    test("201 returns token + user on success", async () => {
      const User = require("../models/user.model");
      const PhoneVerification = require("../models/phoneVerification.model");
      User.findOne.mockResolvedValueOnce(null);
      User.findOne.mockResolvedValueOnce(null);

      const verificationDoc = {
        verified: true,
        createdAt: new Date(),
        save: jest.fn(async () => ({})),
      };
      PhoneVerification.findOne.mockReturnValueOnce({
        sort: jest.fn(async () => verificationDoc),
      });

      const app = createTestApp();
      const reg = await request(app).post("/api/auth/register").send({
        email: "ok@y.com",
        password: "secret123",
        name: "Ok",
        phone: "9800000002",
      });

      const res = await request(app)
        .post("/api/auth/complete-registration")
        .send({ tempRegistrationId: reg.body.tempRegistrationId });

      expect(res.status).toBe(201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user.email).toBe("ok@y.com");
      expect(verificationDoc.save).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    test("400 when missing email/password", async () => {
      const app = createTestApp();
      const res = await request(app).post("/api/auth/login").send({ email: "a@b.com" });
      expect(res.status).toBe(400);
    });

    test("401 when user not found", async () => {
      const User = require("../models/user.model");
      User.findOne.mockResolvedValueOnce(null);
      const app = createTestApp();
      const res = await request(app).post("/api/auth/login").send({
        email: "missing@b.com",
        password: "secret123",
      });
      expect(res.status).toBe(401);
    });

    test("401 when password mismatch", async () => {
      const User = require("../models/user.model");
      const user = new User({ email: "a@b.com", name: "A", role: "sender" });
      user.comparePassword.mockResolvedValueOnce(false);
      User.findOne.mockResolvedValueOnce(user);
      const app = createTestApp();
      const res = await request(app).post("/api/auth/login").send({
        email: "a@b.com",
        password: "wrong",
      });
      expect(res.status).toBe(401);
    });

    test("200 when login succeeds", async () => {
      const User = require("../models/user.model");
      const user = new User({ email: "a@b.com", name: "A", role: "sender" });
      user.comparePassword.mockResolvedValueOnce(true);
      User.findOne.mockResolvedValueOnce(user);
      const app = createTestApp();

      const res = await request(app).post("/api/auth/login").send({
        email: "a@b.com",
        password: "secret123",
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user.email).toBe("a@b.com");
    });
  });

  describe("GET /api/auth/me", () => {
    test("returns current user (via mocked authenticate)", async () => {
      const User = require("../models/user.model");
      User.findById.mockReturnValueOnce({
        select: jest.fn(async () => ({
          _id: "user123",
          email: "me@b.com",
          name: "Me",
          phone: "+9779800000000",
          role: "sender",
          verified: true,
        })),
      });

      const app = createTestApp();
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("me@b.com");
      expect(res.body.user.permanentAddress).toBeNull();
    });
  });
});

