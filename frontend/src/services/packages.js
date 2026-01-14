import createAPI from './api';

const packagesService = {
  create: async (packageData) => {
    const api = createAPI();
    const response = await api.post('/api/packages', packageData);
    return response.data.package;
  },

  list: async (params = {}) => {
    const api = createAPI();
    const response = await api.get('/api/packages', { params });
    return response.data.packages;
  },

  historyMine: async (params = {}) => {
    const api = createAPI();
    const response = await api.get('/api/packages/history/mine', { params });
    return response.data.packages;
  },

  // For travellers to search available (pending) packages by destination
  searchAvailable: async (destinationText = '') => {
    const api = createAPI();
    const response = await api.get('/api/packages/available/search', {
      params: { destination: destinationText || undefined }
    });
    return response.data.packages;
  },

  getById: async (id) => {
    const api = createAPI();
    const response = await api.get(`/api/packages/${id}`);
    return response.data.package;
  },

  getByCode: async (code) => {
    const api = createAPI();
    const response = await api.get(`/api/packages/code/${code}`);
    return response.data.package;
  },

  getMatches: async (packageId) => {
    const api = createAPI();
    const response = await api.get(`/api/packages/${packageId}/matches`);
    return response.data.matches;
  },

  accept: async (packageId, tripId) => {
    const api = createAPI();
    const response = await api.post(`/api/packages/${packageId}/accept`, { tripId });
    return response.data.package;
  },

  pickup: async (packageId, pickupProof = null) => {
    const api = createAPI();
    const response = await api.post(`/api/packages/${packageId}/pickup`, { pickupProof });
    return response.data.package;
  },

  deliver: async (packageId, deliveryProof = null) => {
    const api = createAPI();
    const response = await api.post(`/api/packages/${packageId}/deliver`, { deliveryProof });
    return response.data.package;
  },

  verifyDelivery: async (packageId, otp) => {
    const api = createAPI();
    const response = await api.post(`/api/packages/${packageId}/verify-delivery`, { otp });
    return response.data.package;
  },

  dispute: async (packageId, reason) => {
    const api = createAPI();
    const response = await api.post(`/api/packages/${packageId}/dispute`, { reason });
    return response.data.package;
  },

  update: async (packageId, packageData) => {
    const api = createAPI();
    const response = await api.put(`/api/packages/${packageId}`, packageData);
    return response.data.package;
  },

  delete: async (packageId) => {
    const api = createAPI();
    const response = await api.delete(`/api/packages/${packageId}`);
    return response.data;
  }
};

export default packagesService;










