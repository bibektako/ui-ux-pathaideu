describe("src/services/wallet", () => {
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

  function mockStore(user = { id: "u1", walletBalance: 0 }) {
    const updateUser = jest.fn();
    jest.doMock("../src/state/useAuthStore", () => ({
      __esModule: true,
      default: { getState: () => ({ user, updateUser }) },
    }));
    return { updateUser };
  }

  test("topUp updates user wallet balance", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { balance: 150 } });
    const { updateUser } = mockStore({ id: "u1", walletBalance: 0 });
    const svc = require("../src/services/wallet").default;
    const res = await svc.topUp(50);
    expect(api.post).toHaveBeenCalledWith("/api/wallet/topup", { amount: 50 });
    expect(updateUser).toHaveBeenCalledWith({ id: "u1", walletBalance: 150 });
    expect(res.balance).toBe(150);
  });

  test("getBalance fetches balance", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { balance: 20 } });
    const svc = require("../src/services/wallet").default;
    const balance = await svc.getBalance();
    expect(api.get).toHaveBeenCalledWith("/api/wallet/balance");
    expect(balance).toBe(20);
  });

  test("getTransactions returns transactions", async () => {
    const api = mockAPI();
    api.get.mockResolvedValueOnce({ data: { transactions: [1, 2] } });
    const svc = require("../src/services/wallet").default;
    const txs = await svc.getTransactions();
    expect(api.get).toHaveBeenCalledWith("/api/wallet/transactions");
    expect(txs).toEqual([1, 2]);
  });

  test("hold posts packageId and updates balance", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { balance: 80 } });
    const { updateUser } = mockStore({ id: "u1", walletBalance: 100 });
    const svc = require("../src/services/wallet").default;
    await svc.hold("pkg1");
    expect(api.post).toHaveBeenCalledWith("/api/wallet/hold", { packageId: "pkg1" });
    expect(updateUser).toHaveBeenCalledWith({ id: "u1", walletBalance: 80 });
  });

  test("release posts packageId", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { ok: true } });
    mockStore();
    const svc = require("../src/services/wallet").default;
    await svc.release("pkg1");
    expect(api.post).toHaveBeenCalledWith("/api/wallet/release", { packageId: "pkg1" });
  });

  test("refund posts packageId and updates sender balance", async () => {
    const api = mockAPI();
    api.post.mockResolvedValueOnce({ data: { senderBalance: 55 } });
    const { updateUser } = mockStore({ id: "u1", walletBalance: 0 });
    const svc = require("../src/services/wallet").default;
    await svc.refund("pkg1");
    expect(api.post).toHaveBeenCalledWith("/api/wallet/refund", { packageId: "pkg1" });
    expect(updateUser).toHaveBeenCalledWith({ id: "u1", walletBalance: 55 });
  });
});

