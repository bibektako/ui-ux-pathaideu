import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import notificationsService from '../services/notifications';
import useAuthStore from '../state/useAuthStore';

export const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, token } = useAuthStore();

  const fetchUnreadCount = useCallback(async () => {
    // Only fetch if user is authenticated and has a token
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Silently fail - don't log errors if user is not authenticated
      if (error.response?.status !== 401) {
        console.error('Error fetching unread count:', error);
      }
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchUnreadCount();
    
    // Poll for updates every 30 seconds (only if authenticated)
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount, isAuthenticated, token]);

  // Refresh when screen comes into focus (only if authenticated)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token) {
        fetchUnreadCount();
      }
    }, [fetchUnreadCount, isAuthenticated, token])
  );

  return { unreadCount, refresh: fetchUnreadCount, loading };
};

