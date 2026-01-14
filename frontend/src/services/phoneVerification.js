import createAPI from './api';

const phoneVerificationService = {
  /**
   * Send OTP to phone number
   * @param {string} phone - Phone number
   * @param {string} purpose - 'registration' or 'update_phone'
   * @param {string} userId - Optional user ID for update_phone purpose
   */
  sendOTP: async (phone, purpose, userId = null) => {
    try {
      const api = createAPI();
      const response = await api.post('/api/phone-verification/send', {
        phone,
        purpose,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  },

  /**
   * Verify OTP
   * @param {string} phone - Phone number
   * @param {string} otp - 6-digit OTP
   * @param {string} purpose - 'registration' or 'update_phone'
   * @param {string} userId - Optional user ID for update_phone purpose
   */
  verifyOTP: async (phone, otp, purpose, userId = null) => {
    try {
      const api = createAPI();
      console.log('📤 Sending verify OTP request:', { phone, otp: '***', purpose, userId });
      const response = await api.post('/api/phone-verification/verify', {
        phone,
        otp,
        purpose,
        userId
      });
      console.log('✅ Verify OTP response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error verifying OTP:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      // Throw the original error to preserve response data
      throw error;
    }
  },

  /**
   * Check verification status
   * @param {string} phone - Phone number
   * @param {string} purpose - 'registration' or 'update_phone'
   */
  checkStatus: async (phone, purpose) => {
    try {
      const api = createAPI();
      const response = await api.get('/api/phone-verification/status', {
        params: { phone, purpose }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking verification status:', error);
      throw error;
    }
  }
};

export default phoneVerificationService;

