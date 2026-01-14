import createAPI from './api';
import useAuthStore from '../state/useAuthStore';

const authService = {
  completeRegistration: async (tempRegistrationId) => {
    try {
      const api = createAPI();
      const response = await api.post('/api/auth/complete-registration', {
        tempRegistrationId
      });
      return response.data;
    } catch (error) {
      console.error('Error completing registration:', error);
      throw error;
    }
  },

  register: async (email, password, name, phone, role) => {
    const api = createAPI();
    const response = await api.post('/api/auth/register', {
      email,
      password,
      name,
      phone,
      role
    });
    // Returns tempRegistrationId and phone for verification
    return response.data;
  },

  login: async (email, password) => {
    const api = createAPI();
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    const { user, token } = response.data;
    await useAuthStore.getState().setAuth(user, token);
    return { user, token };
  },

  getMe: async () => {
    const api = createAPI();
    const response = await api.get('/api/auth/me');
    const { user } = response.data;
    useAuthStore.getState().updateUser(user);
    return user;
  },

  logout: async () => {
    await useAuthStore.getState().logout();
  },

  forgotPassword: async (email) => {
    const api = createAPI();
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPasswordWithOtp: async (email, otp, newPassword) => {
    const api = createAPI();
    const response = await api.post('/api/auth/reset-password', {
      email,
      otp,
      newPassword
    });
    return response.data;
  }
};

export default authService;








