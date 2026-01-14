describe("src/utils/gpsService", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function mockLocation(overrides = {}) {
    const base = {
      requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
      getCurrentPositionAsync: jest.fn(async () => ({
        coords: { latitude: 1, longitude: 2 },
      })),
      watchPositionAsync: jest.fn((opts, cb) => {
        cb({ coords: { latitude: 3, longitude: 4 } });
        return "watcher";
      }),
      reverseGeocodeAsync: jest.fn(async () => [
        {
          city: "City",
          street: "Main",
          streetNumber: "1",
          name: "Place",
        },
      ]),
      Accuracy: { Balanced: "balanced" },
    };
    return Object.assign(base, overrides);
  }

  test("requestPermissions resolves true when granted", async () => {
    const Location = mockLocation();
    jest.doMock("expo-location", () => Location);
    const gps = require("../src/utils/gps").default;
    const ok = await gps.requestPermissions();
    expect(ok).toBe(true);
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
  });

  test("requestPermissions throws when denied", async () => {
    const Location = mockLocation({
      requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "denied" })),
    });
    jest.doMock("expo-location", () => Location);
    const gps = require("../src/utils/gps").default;
    await expect(gps.requestPermissions()).rejects.toThrow("denied");
  });

  test("getCurrentLocation returns lat/lng/timestamp", async () => {
    const Location = mockLocation();
    jest.doMock("expo-location", () => Location);
    const gps = require("../src/utils/gps").default;
    const loc = await gps.getCurrentLocation();
    expect(loc.lat).toBe(1);
    expect(loc.lng).toBe(2);
    expect(loc.timestamp).toBeInstanceOf(Date);
  });

  test("watchPosition invokes callback with coords", () => {
    const Location = mockLocation();
    jest.doMock("expo-location", () => Location);
    const gps = require("../src/utils/gps").default;
    const cb = jest.fn();
    const watcher = gps.watchPosition(cb);
    expect(cb).toHaveBeenCalledWith({
      lat: 3,
      lng: 4,
      timestamp: expect.any(Date),
    });
    expect(watcher).toBe("watcher");
  });

  test("reverseGeocode returns city/address", async () => {
    const goodLocation = mockLocation();
    jest.doMock("expo-location", () => goodLocation);
    const gps = require("../src/utils/gps").default;
    const addr = await gps.reverseGeocode(1, 2);
    expect(addr.city).toBe("City");
    expect(addr.address).toContain("Main");
  });

  test("reverseGeocode returns empty values on error", async () => {
    jest.resetModules();
    const badLocation = mockLocation({
      reverseGeocodeAsync: jest.fn(async () => {
        throw new Error("fail");
      }),
    });
    jest.doMock("expo-location", () => badLocation);
    const gps = require("../src/utils/gps").default;
    const fallback = await gps.reverseGeocode(1, 2);
    expect(fallback.city).toBe("");
    expect(fallback.address).toBe("");
  });
});

