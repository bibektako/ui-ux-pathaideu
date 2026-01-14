describe("src/utils/imageUtils", () => {
  const originalConsole = { log: console.log };

  beforeEach(() => {
    jest.resetModules();
    console.log = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsole.log;
  });

  function loadModule() {
    return require("../src/utils/imageUtils");
  }

  test("getBaseURL uses localhost for iOS simulator", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "http://1.2.3.4:3000" }) },
    }));
    const { getBaseURL } = loadModule();
    expect(getBaseURL()).toBe("http://localhost:3000");
  });

  test("getBaseURL uses 10.0.2.2 for Android emulator", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "http://9.9.9.9:3000" }) },
    }));
    const { getBaseURL } = loadModule();
    expect(getBaseURL()).toBe("http://10.0.2.2:3000");
  });

  test("getBaseURL derives LAN host from expoConfig.hostUri", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("expo-constants", () => ({
      isDevice: true,
      expoConfig: { hostUri: "192.168.1.10:19000" },
    }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "http://9.9.9.9:3000" }) },
    }));
    const { getBaseURL } = loadModule();
    expect(getBaseURL()).toBe("http://192.168.1.10:3000");
  });

  test("getBaseURL prefers stored IP when no derived IP", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("expo-constants", () => ({ isDevice: true, expoConfig: {} }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "http://9.9.9.9:3000/" }) },
    }));
    const { getBaseURL } = loadModule();
    expect(getBaseURL()).toBe("http://9.9.9.9:3000");
  });

  test("getBaseURL falls back to hardcoded IP", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("expo-constants", () => ({ isDevice: true, expoConfig: {} }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "" }) },
    }));
    const { getBaseURL } = loadModule();
    expect(getBaseURL()).toBe("http://10.12.31.204:3000");
  });

  test("getImageUri returns null for falsy paths", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "http://x" }) },
    }));
    const { getImageUri } = loadModule();
    expect(getImageUri("")).toBeNull();
    expect(getImageUri(null)).toBeNull();
  });

  test("getImageUri returns absolute URLs unchanged", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "http://x" }) },
    }));
    const { getImageUri } = loadModule();
    expect(getImageUri("https://example.com/p.png")).toBe("https://example.com/p.png");
  });

  test("getImageUri prefixes uploads/ and joins with baseURL", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({ isDevice: false }));
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ backendIP: "http://9.9.9.9:3000" }) },
    }));
    const { getImageUri } = loadModule();
    expect(getImageUri("ads/p.png")).toBe("http://localhost:3000/uploads/ads/p.png");
  });
});

