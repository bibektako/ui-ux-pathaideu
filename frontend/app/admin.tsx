import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AdminPanelScreen from '@/src/screens/AdminPanelScreen';
import useAuthStore from '@/src/state/useAuthStore';

export default function Admin() {
  const router = useRouter();
  const { isAuthenticated, user, isLoadingAuth } = useAuthStore();

  useEffect(() => {
    // Wait until auth state is loaded before deciding where to go
    if (isLoadingAuth) return;

    // Not logged in → send to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Logged in but not an admin → send to main app tabs
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoadingAuth, user, router]);

  // While auth is loading or user is being redirected, don't render the admin panel
  if (isLoadingAuth || !isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return <AdminPanelScreen />;
}









