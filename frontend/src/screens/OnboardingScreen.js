import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../state/useAuthStore';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@pathaideu_has_seen_onboarding';

const OnboardingScreen = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Mark onboarding as seen when component mounts
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const handleNext = () => {
    // Navigate to login page
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* Illustration Section - Top 60% */}
      <View style={styles.illustrationSection}>
        <Image
          source={require('../../assets/images/onboarding page (1).png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Text Content Section - Middle 20% */}
      <View style={styles.textSection}>
        <Text style={styles.heading}>
          Monitor Your Package's Journey At Every Stage.
        </Text>
        <Text style={styles.subText}>
          Keep track of your package's location in real-time.
        </Text>
      </View>

      {/* Next Button Section - Bottom 20% */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  illustrationSection: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F0F5',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  illustration: {
    width: width * 0.9,
    height: '100%',
  },
  textSection: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#0047AB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 60,
    minWidth: width * 0.7,
    alignItems: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;

