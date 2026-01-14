import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import HomeScreen from '@/src/screens/HomeScreen';
import useAuthStore from '@/src/state/useAuthStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, user, isLoadingAuth } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Ensure component is mounted before navigation
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading and component to be mounted before making navigation decisions
    if (isMounted && !isLoadingAuth) {
      // Use setTimeout to ensure router is ready
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          router.replace('/login');
        } else if (user?.role === 'admin') {
          // Redirect admins to admin panel
          router.replace('/admin');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isLoadingAuth, isMounted]);

  // Show nothing while auth is loading
  if (isLoadingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  // If admin, don't show home screen (will redirect)
  if (user?.role === 'admin') {
    return null;
  }

  return <HomeScreen />;
}
