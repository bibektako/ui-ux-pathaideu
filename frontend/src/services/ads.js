import createAPI from './api';

const adsService = {
  // Public route - no auth required
  getActiveAds: async () => {
    try {
      const api = createAPI();
      const response = await api.get('/api/ads');
      return response.data?.ads || [];
    } catch (error) {
      console.error('Error fetching ads:', error);
      return [];
    }
  },
  // Admin routes - require auth
  getAllAds: async () => {
    try {
      const api = createAPI();
      const response = await api.get('/api/admin/ads');
      return response.data?.ads || [];
    } catch (error) {
      console.error('Error fetching all ads:', error);
      throw error;
    }
  },
  uploadAd: async (file, title, link) => {
    try {
      const api = createAPI();
      const formData = new FormData();
      
      // Determine file type from asset
      let fileType = file.type || 'image/jpeg';
      let fileName = file.fileName || file.name || 'ad.jpg';
      
      // If it's a video, ensure correct MIME type
      if (file.type === 'video' || fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
        fileType = 'video/mp4';
      } else if (fileName.endsWith('.gif')) {
        fileType = 'image/gif';
      }
      
      formData.append('file', {
        uri: file.uri,
        type: fileType,
        name: fileName
      });
      if (title) formData.append('title', title);
      if (link) formData.append('link', link);

      const response = await api.post('/api/admin/ads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.ad;
    } catch (error) {
      console.error('Error uploading ad:', error);
      throw error;
    }
  },
  updateAd: async (id, data) => {
    try {
      const api = createAPI();
      const response = await api.put(`/api/admin/ads/${id}`, data);
      return response.data.ad;
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  },
  deleteAd: async (id) => {
    try {
      const api = createAPI();
      await api.delete(`/api/admin/ads/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }
};

export default adsService;

