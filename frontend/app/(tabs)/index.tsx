import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import HomeScreen from '@/src/screens/HomeScreen';
import useAuthStore from '@/src/state/useAuthStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, user, loadAuth } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      await loadAuth();
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role === 'admin') {
        // Redirect admins to admin panel
        router.replace('/admin');
      }
    };
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  // If admin, don't show home screen (will redirect)
  if (user?.role === 'admin') {
    return null;
  }

  return <HomeScreen />;
}
