import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AdminPanelScreen from '@/src/screens/AdminPanelScreen';
import useAuthStore from '@/src/state/useAuthStore';

export default function Admin() {
  const router = useRouter();
  const { isAuthenticated, user, loadAuth } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      await loadAuth();
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role !== 'admin') {
        // Redirect non-admin users to home
        router.replace('/(tabs)');
      }
    };
    checkAuth();
  }, []);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return <AdminPanelScreen />;
}









