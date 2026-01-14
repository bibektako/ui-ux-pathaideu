describe("src/services/trips", () => {
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

  test("create posts trip data", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { trip: { id: 1 } } });
    const svc = require("../src/services/trips").default;
    const trip = await svc.create({ a: 1 });
    expect(api.post).toHaveBeenCalledWith("/api/trips", { a: 1 });
    expect(trip.id).toBe(1);
  });

  test("list forwards params", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { trips: [1] } });
    const svc = require("../src/services/trips").default;
    await svc.list({ page: 2 });
    expect(api.get).toHaveBeenCalledWith("/api/trips", { params: { page: 2 } });
  });

  test("getById fetches trip", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { trip: { id: "t1" } } });
    const svc = require("../src/services/trips").default;
    const trip = await svc.getById("t1");
    expect(api.get).toHaveBeenCalledWith("/api/trips/t1");
    expect(trip.id).toBe("t1");
  });

  test("update and cancel call correct endpoints", async () => {
    const api = mockAPI();
    api.put.mockResolvedValueOnce({ data: { trip: { id: "t1", a: 3 } } });
    api.delete.mockResolvedValueOnce({ data: { ok: true } });
    const svc = require("../src/services/trips").default;
    const updated = await svc.update("t1", { a: 3 });
    await svc.cancel("t1");
    expect(api.put).toHaveBeenCalledWith("/api/trips/t1", { a: 3 });
    expect(updated.a).toBe(3);
    expect(api.delete).toHaveBeenCalledWith("/api/trips/t1");
  });

  test("historyMine fetches trips", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { trips: [5, 6] } });
    const svc = require("../src/services/trips").default;
    const trips = await svc.historyMine();
    expect(api.get).toHaveBeenCalledWith("/api/trips/history/mine");
    expect(trips).toEqual([5, 6]);
  });
});

