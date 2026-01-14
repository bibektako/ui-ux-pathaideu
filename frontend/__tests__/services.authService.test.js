describe("src/services/auth", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function mockAPI() {
    const api = {
      post: jest.fn(),
      get: jest.fn(),
    };
    jest.doMock("../src/services/api", () => ({
      __esModule: true,
      default: () => api,
    }));
    return api;
  }

  test("register posts payload and returns data", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { tempRegistrationId: "t1" } });
    const auth = require("../src/services/auth").default;
    const res = await auth.register("a@b.com", "pw", "Name", "123", "sender");
    expect(api.post).toHaveBeenCalledWith("/api/auth/register", {
      email: "a@b.com",
      password: "pw",
      name: "Name",
      phone: "123",
      role: "sender",
    });
    expect(res.tempRegistrationId).toBe("t1");
  });

  test("completeRegistration posts tempRegistrationId", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { ok: true } });
    const auth = require("../src/services/auth").default;
    await auth.completeRegistration("temp1");
    expect(api.post).toHaveBeenCalledWith("/api/auth/complete-registration", {
      tempRegistrationId: "temp1",
    });
  });

  test("login sets auth store with returned user/token", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({
      data: { user: { id: 1 }, token: "tok" },
    });
    const setAuth = jest.fn();
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ setAuth }) },
    }));
    const auth = require("../src/services/auth").default;
    const res = await auth.login("a@b.com", "pw");
    expect(setAuth).toHaveBeenCalledWith({ id: 1 }, "tok");
    expect(res.token).toBe("tok");
  });

  test("getMe fetches user and updates store", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { user: { id: 2, name: "X" } } });
    const updateUser = jest.fn();
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ updateUser }) },
    }));
    const auth = require("../src/services/auth").default;
    const user = await auth.getMe();
    expect(api.get).toHaveBeenCalledWith("/api/auth/me");
    expect(updateUser).toHaveBeenCalledWith({ id: 2, name: "X" });
    expect(user.name).toBe("X");
  });

  test("logout calls store.logout", async () => {
    const logout = jest.fn();
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ logout }) },
    }));
    const auth = require("../src/services/auth").default;
    await auth.logout();
    expect(logout).toHaveBeenCalled();
  });

  test("forgotPassword posts email", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { ok: true } });
    const auth = require("../src/services/auth").default;
    await auth.forgotPassword("a@b.com");
    expect(api.post).toHaveBeenCalledWith("/api/auth/forgot-password", {
      email: "a@b.com",
    });
  });

  test("resetPasswordWithOtp posts payload", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { ok: true } });
    const auth = require("../src/services/auth").default;
    await auth.resetPasswordWithOtp("a@b.com", "123456", "newpw");
    expect(api.post).toHaveBeenCalledWith("/api/auth/reset-password", {
      email: "a@b.com",
      otp: "123456",
      newPassword: "newpw",
    });
  });
});

