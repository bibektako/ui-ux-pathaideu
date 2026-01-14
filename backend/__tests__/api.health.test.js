const request = require("supertest");

describe("GET /api/health", () => {
  test("returns status ok", async () => {
    const app = require("../app");
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("returns an ISO timestamp", async () => {
    const app = require("../app");
    const res = await request(app).get("/api/health");
    expect(typeof res.body.timestamp).toBe("string");
    expect(() => new Date(res.body.timestamp).toISOString()).not.toThrow();
  });
});

