describe("src/services/packages", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function mockAPI() {
    const api = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    jest.doMock("../src/services/api", () => ({
      __esModule: true,
      default: () => api,
    }));
    return api;
  }

  test("create posts package data", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { package: { id: 1 } } });
    const svc = require("../src/services/packages").default;
    const pkg = await svc.create({ a: 1 });
    expect(api.post).toHaveBeenCalledWith("/api/packages", { a: 1 });
    expect(pkg.id).toBe(1);
  });

  test("list forwards params", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { packages: [1, 2] } });
    const svc = require("../src/services/packages").default;
    const list = await svc.list({ status: "pending" });
    expect(api.get).toHaveBeenCalledWith("/api/packages", { params: { status: "pending" } });
    expect(list).toEqual([1, 2]);
  });

  test("historyMine passes params and returns packages", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { packages: [3] } });
    const svc = require("../src/services/packages").default;
    const list = await svc.historyMine({ page: 2 });
    expect(api.get).toHaveBeenCalledWith("/api/packages/history/mine", { params: { page: 2 } });
    expect(list).toEqual([3]);
  });

  test("searchAvailable sends destination param", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { packages: [] } });
    const svc = require("../src/services/packages").default;
    await svc.searchAvailable("NYC");
    expect(api.get).toHaveBeenCalledWith("/api/packages/available/search", {
      params: { destination: "NYC" },
    });
  });

  test("getById fetches package", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { package: { id: "p1" } } });
    const svc = require("../src/services/packages").default;
    const pkg = await svc.getById("p1");
    expect(api.get).toHaveBeenCalledWith("/api/packages/p1");
    expect(pkg.id).toBe("p1");
  });

  test("getByCode fetches package by code", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { package: { code: "C123" } } });
    const svc = require("../src/services/packages").default;
    await svc.getByCode("C123");
    expect(api.get).toHaveBeenCalledWith("/api/packages/code/C123");
  });

  test("getMatches fetches matches", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { matches: [1] } });
    const svc = require("../src/services/packages").default;
    const matches = await svc.getMatches("pkg1");
    expect(api.get).toHaveBeenCalledWith("/api/packages/pkg1/matches");
    expect(matches).toEqual([1]);
  });

  test("accept posts tripId", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { package: { id: "pkg" } } });
    const svc = require("../src/services/packages").default;
    await svc.accept("pkg", "trip");
    expect(api.post).toHaveBeenCalledWith("/api/packages/pkg/accept", { tripId: "trip" });
  });

  test("pickup/deliver/verify/dispute call correct endpoints", async () => {
    const api = mockAPI();
    api.post.mockResolvedValue({ data: { package: {} } });
    const svc = require("../src/services/packages").default;
    await svc.pickup("p1", "proof");
    await svc.deliver("p1", "dproof");
    await svc.verifyDelivery("p1", "otp");
    await svc.dispute("p1", "reason");
    expect(api.post).toHaveBeenCalledWith("/api/packages/p1/pickup", { pickupProof: "proof" });
    expect(api.post).toHaveBeenCalledWith("/api/packages/p1/deliver", { deliveryProof: "dproof" });
    expect(api.post).toHaveBeenCalledWith("/api/packages/p1/verify-delivery", { otp: "otp" });
    expect(api.post).toHaveBeenCalledWith("/api/packages/p1/dispute", { reason: "reason" });
  });

  test("update and delete use put/delete", async () => {
    const api = mockAPI();
    api.put.mockResolvedValueOnce({ data: { package: { id: "p1", a: 2 } } });
    api.delete.mockResolvedValueOnce({ data: { ok: true } });
    const svc = require("../src/services/packages").default;
    const updated = await svc.update("p1", { a: 2 });
    await svc.delete("p1");
    expect(api.put).toHaveBeenCalledWith("/api/packages/p1", { a: 2 });
    expect(updated.a).toBe(2);
    expect(api.delete).toHaveBeenCalledWith("/api/packages/p1");
  });
});

