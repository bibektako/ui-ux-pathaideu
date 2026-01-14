import { Platform } from 'react-native';
import Constants from 'expo-constants';
import useAuthStore from '../state/useAuthStore';

/**
 * Get the base URL for API requests and images
 * Uses the EXACT same logic as api.js for consistency
 */
export const getBaseURL = () => {
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  // Simulator/Emulator detection (same as api.js)
  const isIOSSimulator = isIOS && Constants.isDevice === false;
  const isAndroidEmulator = isAndroid && Constants.isDevice === false;

  // Always use localhost for iOS simulator
  if (isIOSSimulator) {
    return 'http://localhost:3000';
  }

  // Helper to derive a LAN IP from Expo host if available
  const getDerivedLanURL = () => {
    try {
      const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.manifest2?.extra?.expoClient?.hostUri ||
        Constants.manifest?.debuggerHost;

      if (hostUri) {
        const host = hostUri.split(':')[0];
        if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
          return `http://${host}:3000`;
        }
      }
    } catch (e) {
      // Silent fail
    }
    return null;
  };

  // Android emulator check
  if (isAndroidEmulator) {
    return 'http://10.0.2.2:3000';
  }

  // Get stored IP and derived IP
  const storedIP = useAuthStore.getState().backendIP;
  const derivedIP = getDerivedLanURL();

  // Priority: Auto-detected IP > Stored IP > Fallback
  if (derivedIP) {
    return derivedIP;
  }

  if (storedIP && !storedIP.includes('localhost') && !storedIP.includes('10.0.2.2')) {
    return storedIP.endsWith('/') ? storedIP.slice(0, -1) : storedIP;
  }

  // Final fallback
  return 'http://10.12.31.204:3000';
};

/**
 * Get the full URI for an image path
 * @param {string} imagePath - The image path from the database
 * @returns {string|null} - The full URI for the image or null if path is invalid
 */
export const getImageUri = (imagePath) => {
  if (!imagePath) return null;
  
  const baseURL = getBaseURL();
  
  // If path already starts with http, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Ensure path starts with 'uploads/' if it doesn't already
  // Backend stores paths like 'uploads/ads/image.jpg' or 'uploads/ids/id.jpg'
  const finalPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  
  const fullUri = `${baseURL}/${finalPath}`;
  
  console.log('🖼️ Image URI:', { imagePath, cleanPath, finalPath, baseURL, fullUri });
  return fullUri;
};

