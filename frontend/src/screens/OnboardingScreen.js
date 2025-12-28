import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

  // If user is already authenticated, they can skip to home
  const handleSkip = () => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Image */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            style={styles.gradientHeader}
          >
            <View style={styles.imageContainer}>
              <Text style={styles.mainIcon}>🚚</Text>
            </View>
            <Text style={styles.appName}>Pathaideu</Text>
            <Text style={styles.slogan}>
              Connect. Deliver. Trust.
            </Text>
            <Text style={styles.description}>
              Your trusted peer-to-peer package delivery platform. 
              Send packages with travelers or carry packages on your journey.
            </Text>
          </LinearGradient>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <Ionicons name="cube-outline" size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Send Packages</Text>
            <Text style={styles.featureText}>
              Find travelers going your way and send packages safely
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="briefcase-outline" size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Carry Packages</Text>
            <Text style={styles.featureText}>
              Earn money by carrying packages on your trips
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="location-outline" size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Real-time Tracking</Text>
            <Text style={styles.featureText}>
              Track your packages in real-time with GPS
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007AFF', '#0051D5']}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    width: '100%',
  },
  gradientHeader: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainIcon: {
    fontSize: 70,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '300',
  },
  featuresSection: {
    padding: 30,
    paddingTop: 40,
  },
  featureItem: {
    alignItems: 'center',
    marginBottom: 35,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionsSection: {
    padding: 30,
    paddingBottom: 50,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OnboardingScreen;

