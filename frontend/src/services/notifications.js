import createAPI from './api';

const notificationsService = {
  list: async () => {
    try {
      const api = createAPI();
      const response = await api.get('/api/notifications');
      const notifications = response.data?.notifications || [];
      console.log('📬 Fetched notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error.response?.data || error.message);
      throw error;
    }
  },
  getUnreadCount: async () => {
    try {
      const api = createAPI();
      const response = await api.get('/api/notifications/unread-count');
      return response.data?.count || 0;
    } catch (error) {
      console.error('❌ Error fetching unread count:', error.response?.data || error.message);
      return 0;
    }
  },
  markRead: async (id) => {
    const api = createAPI();
    const response = await api.post(`/api/notifications/read/${id}`);
    return response.data.notification;
  },
  markAllRead: async () => {
    const api = createAPI();
    const response = await api.post('/api/notifications/read-all');
    return response.data;
  }
};

export default notificationsService;





