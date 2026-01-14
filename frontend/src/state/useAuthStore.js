import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoadingAuth: false,
  backendIP: 'http://10.12.31.204:3000', // Default LAN IP - user should update in settings

  setBackendIP: async (ip) => {
    set({ backendIP: ip });
    await AsyncStorage.setItem("backendIP", ip);
  },

  clearBackendIP: async () => {
    await AsyncStorage.removeItem("backendIP");
    const defaultIP = 'http://10.12.31.204:3000';
    set({ backendIP: defaultIP });
    await AsyncStorage.setItem("backendIP", defaultIP);
  },

  loadBackendIP: async () => {
    const ip = await AsyncStorage.getItem("backendIP");
    const defaultIP = 'http://10.12.31.204:3000';
    
    // If no stored IP or if it's an old IP, use the new default
    if (!ip || ip === 'http://10.1.4.217:3000' || ip === 'http://10.1.4.216:3000' || ip === 'http://192.168.2.101:3000') {
      set({ backendIP: defaultIP });
      await AsyncStorage.setItem("backendIP", defaultIP);
    } else {
      set({ backendIP: ip });
    }
  },

  setAuth: async (user, token) => {
    set({ user, token, isAuthenticated: !!token });
    if (token) {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
    }
  },

  loadAuth: async () => {
    try {
      set({ isLoadingAuth: true });
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // First, restore auth state from storage (optimistic restore)
        // This allows the app to work even if validation fails due to network issues
        set({ user, token, isAuthenticated: true });
        
        // Then validate token with backend (silently in background)
        try {
          const createAPI = require('../services/api').default;
          const api = createAPI();
          const response = await api.get('/api/auth/me');
          
          // Token is valid, update user data
          const updatedUser = response.data.user;
          set({ user: updatedUser, isLoadingAuth: false });
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          return { user: updatedUser, token };
        } catch (error) {
          // Only clear auth if it's actually unauthorized (401)
          // Network errors or other issues should not clear the stored auth
          if (error.response?.status === 401) {
            // Token is invalid or expired, clear auth state
            console.log('Token expired or invalid, clearing auth');
            set({ user: null, token: null, isAuthenticated: false, isLoadingAuth: false });
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            return null;
          } else {
            // Network error or other issue - keep stored auth state
            // User can still use the app, token will be validated on next request
            console.log('Token validation skipped due to network/backend issue, using stored auth');
            set({ isLoadingAuth: false });
            return { user, token };
          }
        }
      }
      set({ isLoadingAuth: false });
      return null;
    } catch (error) {
      console.error('Error loading auth:', error);
      set({ isLoadingAuth: false });
      return null;
    }
  },

  logout: async () => {
    set({ user: null, token: null, isAuthenticated: false });
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  },

  updateUser: (user) => {
    set({ user });
    AsyncStorage.setItem("user", JSON.stringify(user));
  },
}));

export default useAuthStore;
