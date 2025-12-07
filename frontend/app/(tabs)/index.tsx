import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import HomeScreen from '@/src/screens/HomeScreen';
import useAuthStore from '@/src/state/useAuthStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, loadAuth } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      await loadAuth();
      if (!isAuthenticated) {
        router.replace('/login');
      }
    };
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return <HomeScreen />;
}
