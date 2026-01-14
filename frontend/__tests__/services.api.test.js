describe("src/services/api (createAPI)", () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.resetModules();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  function mockAxiosCapture() {
    const captured = {
      requestFulfilled: null,
      responseRejected: null,
      responseFulfilled: null,
    };

    jest.doMock("axios", () => {
      return {
        create: jest.fn(() => ({
          interceptors: {
            request: {
              use: (fn) => {
                captured.requestFulfilled = fn;
              },
            },
            response: {
              use: (ok, bad) => {
                captured.responseFulfilled = ok;
                captured.responseRejected = bad;
              },
            },
          },
        })),
      };
    });

    return captured;
  }

  test("uses localhost for iOS simulator", () => {
    const captured = mockAxiosCapture();

    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));

    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: {
        getState: () => ({ token: null, backendIP: "http://1.2.3.4:3000", logout: jest.fn() }),
      },
    }));

    const createAPI = require("../src/services/api").default;
    createAPI();

    const cfg = captured.requestFulfilled({ headers: {}, url: "/api/health" });
    expect(cfg.baseURL).toBe("http://localhost:3000");
  });

  test("uses 10.0.2.2 for Android emulator", () => {
    const captured = mockAxiosCapture();

    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));

    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: {
        getState: () => ({ token: null, backendIP: "http://1.2.3.4:3000", logout: jest.fn() }),
      },
    }));

    const createAPI = require("../src/services/api").default;
    createAPI();

    const cfg = captured.requestFulfilled({ headers: {}, url: "/api/health" });
    expect(cfg.baseURL).toBe("http://10.0.2.2:3000");
  });

  test("derives LAN URL from expoConfig.hostUri when available", () => {
    const captured = mockAxiosCapture();

    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("expo-constants", () => ({
      isDevice: true,
      expoConfig: { hostUri: "192.168.1.10:19000" },
    }));

    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: {
        getState: () => ({ token: null, backendIP: "http://1.2.3.4:3000", logout: jest.fn() }),
      },
    }));

    const createAPI = require("../src/services/api").default;
    createAPI();

    const cfg = captured.requestFulfilled({ headers: {}, url: "/api/health" });
    expect(cfg.baseURL).toBe("http://192.168.1.10:3000");
  });

  test("falls back to stored IP when derived IP is not available", () => {
    const captured = mockAxiosCapture();

    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("expo-constants", () => ({ isDevice: true, expoConfig: {} }));

    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: {
        getState: () => ({ token: null, backendIP: "http://9.9.9.9:3000", logout: jest.fn() }),
      },
    }));

    const createAPI = require("../src/services/api").default;
    createAPI();

    const cfg = captured.requestFulfilled({ headers: {}, url: "/api/health" });
    expect(cfg.baseURL).toBe("http://9.9.9.9:3000");
  });

  test("attaches Authorization header when token exists", () => {
    const captured = mockAxiosCapture();

    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));

    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: {
        getState: () => ({ token: "t123", backendIP: "http://x:3000", logout: jest.fn() }),
      },
    }));

    const createAPI = require("../src/services/api").default;
    createAPI();

    const cfg = captured.requestFulfilled({ headers: {}, url: "/api/health" });
    expect(cfg.headers.Authorization).toBe("Bearer t123");
  });

  test("logs out on 401 for non-/api/auth/me endpoints", async () => {
    const captured = mockAxiosCapture();

    const logout = jest.fn(async () => {});
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ token: "t", backendIP: "http://x:3000", logout }) },
    }));

    const createAPI = require("../src/services/api").default;
    createAPI();

    const err = {
      response: { status: 401 },
      config: { url: "/api/packages" },
    };
    await expect(captured.responseRejected(err)).rejects.toBe(err);
    expect(logout).toHaveBeenCalled();
  });

  test("does not log out on 401 for /api/auth/me endpoint", async () => {
    const captured = mockAxiosCapture();

    const logout = jest.fn(async () => {});
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ token: "t", backendIP: "http://x:3000", logout }) },
    }));

    const createAPI = require("../src/services/api").default;
    createAPI();

    const err = {
      response: { status: 401 },
      config: { url: "/api/auth/me" },
    };
    await expect(captured.responseRejected(err)).rejects.toBe(err);
    expect(logout).not.toHaveBeenCalled();
  });
});

