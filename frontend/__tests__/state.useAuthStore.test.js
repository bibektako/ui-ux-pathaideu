describe("src/state/useAuthStore", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function mockAsyncStorage() {
    const store = new Map();
    return {
      getItem: jest.fn(async (k) => (store.has(k) ? store.get(k) : null)),
      setItem: jest.fn(async (k, v) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k) => {
        store.delete(k);
      }),
      __store: store,
    };
  }

  test("setBackendIP persists backendIP", async () => {
    const AsyncStorage = mockAsyncStorage();
    jest.doMock("@react-native-async-storage/async-storage", () => AsyncStorage);

    const useAuthStore = require("../src/state/useAuthStore").default;
    await useAuthStore.getState().setBackendIP("http://1.2.3.4:3000");

    expect(useAuthStore.getState().backendIP).toBe("http://1.2.3.4:3000");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("backendIP", "http://1.2.3.4:3000");
  });

  test("clearBackendIP resets to default and persists it", async () => {
    const AsyncStorage = mockAsyncStorage();
    jest.doMock("@react-native-async-storage/async-storage", () => AsyncStorage);

    const useAuthStore = require("../src/state/useAuthStore").default;
    await useAuthStore.getState().setBackendIP("http://9.9.9.9:3000");
    await useAuthStore.getState().clearBackendIP();

    expect(useAuthStore.getState().backendIP).toBe("http://10.12.31.204:3000");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("backendIP", "http://10.12.31.204:3000");
  });

  test("loadBackendIP uses default when nothing stored", async () => {
    const AsyncStorage = mockAsyncStorage();
    jest.doMock("@react-native-async-storage/async-storage", () => AsyncStorage);

    const useAuthStore = require("../src/state/useAuthStore").default;
    await useAuthStore.getState().loadBackendIP();
    expect(useAuthStore.getState().backendIP).toBe("http://10.12.31.204:3000");
  });

  test("loadBackendIP replaces old hardcoded IPs with default", async () => {
    const AsyncStorage = mockAsyncStorage();
    await AsyncStorage.setItem("backendIP", "http://10.1.4.217:3000");
    jest.doMock("@react-native-async-storage/async-storage", () => AsyncStorage);

    const useAuthStore = require("../src/state/useAuthStore").default;
    await useAuthStore.getState().loadBackendIP();
    expect(useAuthStore.getState().backendIP).toBe("http://10.12.31.204:3000");
  });

  test("setAuth persists token and user when token present", async () => {
    const AsyncStorage = mockAsyncStorage();
    jest.doMock("@react-native-async-storage/async-storage", () => AsyncStorage);
    const useAuthStore = require("../src/state/useAuthStore").default;

    await useAuthStore.getState().setAuth({ id: "1", email: "a@b.com" }, "tok");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("token", "tok");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify({ id: "1", email: "a@b.com" }));
  });

  test("logout clears auth state and storage", async () => {
    const AsyncStorage = mockAsyncStorage();
    jest.doMock("@react-native-async-storage/async-storage", () => AsyncStorage);
    const useAuthStore = require("../src/state/useAuthStore").default;

    await useAuthStore.getState().setAuth({ id: "1" }, "tok");
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("token");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("user");
  });
});

