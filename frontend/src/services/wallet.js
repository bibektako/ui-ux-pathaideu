import createAPI from './api';
import useAuthStore from '../state/useAuthStore';

const walletService = {
  topUp: async (amount) => {
    const api = createAPI();
    const response = await api.post('/api/wallet/topup', { amount });
    // Update user balance in store
    const user = useAuthStore.getState().user;
    if (user) {
      user.walletBalance = response.data.balance;
      useAuthStore.getState().updateUser(user);
    }
    return response.data;
  },

  getBalance: async () => {
    const api = createAPI();
    const response = await api.get('/api/wallet/balance');
    return response.data.balance;
  },

  getTransactions: async () => {
    const api = createAPI();
    const response = await api.get('/api/wallet/transactions');
    return response.data.transactions;
  },

  hold: async (packageId) => {
    const api = createAPI();
    const response = await api.post('/api/wallet/hold', { packageId });
    // Update user balance
    const user = useAuthStore.getState().user;
    if (user) {
      user.walletBalance = response.data.balance;
      useAuthStore.getState().updateUser(user);
    }
    return response.data;
  },

  release: async (packageId) => {
    const api = createAPI();
    const response = await api.post('/api/wallet/release', { packageId });
    return response.data;
  },

  refund: async (packageId) => {
    const api = createAPI();
    const response = await api.post('/api/wallet/refund', { packageId });
    // Update user balance
    const user = useAuthStore.getState().user;
    if (user) {
      user.walletBalance = response.data.senderBalance;
      useAuthStore.getState().updateUser(user);
    }
    return response.data;
  }
};

export default walletService;




















