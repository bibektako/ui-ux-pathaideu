describe("src/services/notifications", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function mockAPI() {
    const api = {
      get: jest.fn(),
      post: jest.fn(),
    };
    jest.doMock("../src/services/api", () => ({
      __esModule: true,
      default: () => api,
    }));
    return api;
  }

  test("list returns notifications array", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { notifications: [{ id: 1 }] } });
    const svc = require("../src/services/notifications").default;
    const list = await svc.list();
    expect(api.get).toHaveBeenCalledWith("/api/notifications");
    expect(list).toEqual([{ id: 1 }]);
  });

  test("list throws on error", async () => {
    const api = mockAPI();
    api.get.mockRejectedValueOnce(new Error("boom"));
    const svc = require("../src/services/notifications").default;
    await expect(svc.list()).rejects.toThrow("boom");
  });

  test("getUnreadCount returns count", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { count: 4 } });
    const svc = require("../src/services/notifications").default;
    const count = await svc.getUnreadCount();
    expect(api.get).toHaveBeenCalledWith("/api/notifications/unread-count");
    expect(count).toBe(4);
  });

  test("getUnreadCount returns 0 on error", async () => {
    const api = mockAPI();
    api.get.mockRejectedValueOnce(new Error("fail"));
    const svc = require("../src/services/notifications").default;
    const count = await svc.getUnreadCount();
    expect(count).toBe(0);
  });

  test("markRead posts id and returns notification", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { notification: { id: "n1" } } });
    const svc = require("../src/services/notifications").default;
    const notification = await svc.markRead("n1");
    expect(api.post).toHaveBeenCalledWith("/api/notifications/read/n1");
    expect(notification.id).toBe("n1");
  });

  test("markAllRead posts without id", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { ok: true } });
    const svc = require("../src/services/notifications").default;
    await svc.markAllRead();
    expect(api.post).toHaveBeenCalledWith("/api/notifications/read-all");
  });
});

