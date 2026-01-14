import createAPI from './api';

const tripsService = {
  create: async (tripData) => {
    const api = createAPI();
    const response = await api.post('/api/trips', tripData);
    return response.data.trip;
  },

  list: async (params = {}) => {
    const api = createAPI();
    const response = await api.get('/api/trips', { params });
    return response.data.trips;
  },

  getById: async (id) => {
    const api = createAPI();
    const response = await api.get(`/api/trips/${id}`);
    return response.data.trip;
  },

  update: async (id, updates) => {
    const api = createAPI();
    const response = await api.put(`/api/trips/${id}`, updates);
    return response.data.trip;
  },

  cancel: async (id) => {
    const api = createAPI();
    const response = await api.delete(`/api/trips/${id}`);
    return response.data;
  },

  historyMine: async () => {
    const api = createAPI();
    const response = await api.get('/api/trips/history/mine');
    return response.data.trips;
  }
};

export default tripsService;














