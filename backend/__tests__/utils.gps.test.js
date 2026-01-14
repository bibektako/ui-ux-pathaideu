const {
  haversineDistance,
  isWithinRadius,
  calculateRouteDistance,
} = require("../utils/gps");

describe("utils/gps", () => {
  test("haversineDistance is ~0 for identical coordinates", () => {
    expect(haversineDistance(27.7172, 85.324, 27.7172, 85.324)).toBeCloseTo(
      0,
      6
    );
  });

  test("haversineDistance is symmetric", () => {
    const a = haversineDistance(27.7, 85.3, 28.2, 83.99);
    const b = haversineDistance(28.2, 83.99, 27.7, 85.3);
    expect(a).toBeCloseTo(b, 8);
  });

  test("haversineDistance increases with farther points", () => {
    const near = haversineDistance(27.7172, 85.324, 27.72, 85.33);
    const far = haversineDistance(27.7172, 85.324, 28.2096, 83.9856); // Pokhara-ish
    expect(far).toBeGreaterThan(near);
  });

  test("isWithinRadius returns true when inside radius", () => {
    expect(isWithinRadius(27.7172, 85.324, 27.72, 85.33, 2)).toBe(true);
  });

  test("isWithinRadius returns false when outside radius", () => {
    expect(isWithinRadius(27.7172, 85.324, 28.2096, 83.9856, 50)).toBe(false);
  });

  test("calculateRouteDistance uses origin/destination shape", () => {
    const origin = { coordinates: { lat: 27.7172, lng: 85.324 } };
    const destination = { coordinates: { lat: 28.2096, lng: 83.9856 } };
    const d = calculateRouteDistance(origin, destination);
    expect(d).toBeGreaterThan(0);
  });
});

