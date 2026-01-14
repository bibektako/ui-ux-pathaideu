import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '@/src/state/useAuthStore';
import SplashScreen from '@/src/screens/SplashScreen';

const ONBOARDING_KEY = '@pathaideu_has_seen_onboarding';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, loadAuth } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Load auth state and onboarding status
    const init = async () => {
      await loadAuth();
      
      // Check if user has seen onboarding before
      const seenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(seenOnboarding === 'true');
      
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoading && !hasNavigated) {
      // Show splash for 3 seconds
      const splashTimer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(splashTimer);
    }
  }, [isLoading, hasNavigated]);

  useEffect(() => {
    if (!showSplash && !isLoading && !hasNavigated) {
      setHasNavigated(true);
      // Navigation flow after splash:
      // 1. If user is already authenticated (valid token), go directly to home tabs
      // 2. If not authenticated and hasn't seen onboarding, go to onboarding
      // 3. If not authenticated and has seen onboarding (new user or expired token), go to login

      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/login');
      }
    }
  }, [showSplash, isLoading, hasNavigated, isAuthenticated, hasSeenOnboarding, router]);

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

