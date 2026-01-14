import createAPI from './api';

const addressService = {
  // Get current address
  get: async () => {
    const api = createAPI();
    const response = await api.get('/api/auth/address');
    return response.data.address;
  },

  // Update or add address (sends verification email)
  update: async (city, address, coordinates) => {
    const api = createAPI();
    const response = await api.put('/api/auth/address', {
      city,
      address,
      coordinates
    });
    return response.data;
  },

  // Verify address with code
  verify: async (verificationId, verificationCode) => {
    const api = createAPI();
    const response = await api.post('/api/auth/address/verify', {
      verificationId,
      verificationCode
    });
    return response.data;
  }
};

export default addressService;


