import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import gpsService from '../utils/gps';
import { updateCourierLocation, updateCourierStatus } from './firebase';

const LOCATION_STORAGE_KEY = '@location_tracking';
const TRACKING_INTERVAL = 10000; // 10 seconds

class LocationTrackingService {
  constructor() {
    this.trackingIntervals = new Map(); // Map of packageId -> intervalId
    this.locationWatchers = new Map(); // Map of packageId -> watcher
    this.appStateSubscription = null;
    this.isTracking = false;
  }

  /**
   * Start tracking location for a package
   * Continues tracking even when screen is closed or app goes to background
   */
  async startTracking(packageId) {
    if (this.trackingIntervals.has(packageId)) {
      console.log(`📍 Already tracking package ${packageId}`);
      return;
    }

    try {
      // Request permissions
      const permissionGranted = await gpsService.requestPermissions();
      if (!permissionGranted) {
        throw new Error('Location permissions are required for tracking');
      }

      // Get initial location
      const initialLocation = await gpsService.getCurrentLocation();
      await this.saveLocation(packageId, initialLocation);
      await updateCourierLocation(packageId, initialLocation.lat, initialLocation.lng, true);

      // Start interval updates
      const intervalId = setInterval(async () => {
        try {
          const location = await gpsService.getCurrentLocation();
          await this.saveLocation(packageId, location);
          await updateCourierLocation(packageId, location.lat, location.lng, true);
          console.log(`📍 Background update for package ${packageId}:`, location);
        } catch (error) {
          console.error(`❌ Error updating location for package ${packageId}:`, error);
        }
      }, TRACKING_INTERVAL);

      this.trackingIntervals.set(packageId, intervalId);

      // Start watching position for smoother updates
      const watcher = gpsService.watchPosition(async (location) => {
        await this.saveLocation(packageId, location);
        // Note: Firebase updates happen via interval to avoid too many writes
      });

      this.locationWatchers.set(packageId, watcher);

      // Monitor app state changes
      if (!this.appStateSubscription) {
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
      }

      console.log(`✅ Started tracking for package ${packageId}`);
      this.isTracking = true;
    } catch (error) {
      console.error(`❌ Error starting tracking for package ${packageId}:`, error);
      throw error;
    }
  }

  /**
   * Stop tracking location for a package
   */
  async stopTracking(packageId) {
    // Clear interval
    const intervalId = this.trackingIntervals.get(packageId);
    if (intervalId) {
      clearInterval(intervalId);
      this.trackingIntervals.delete(packageId);
    }

    // Stop watcher
    const watcher = this.locationWatchers.get(packageId);
    if (watcher && watcher.remove) {
      watcher.remove();
      this.locationWatchers.delete(packageId);
    }

    // Update Firebase status to offline
    await updateCourierStatus(packageId, false);

    // Save last location before stopping
    try {
      const lastLocation = await this.getLastLocation(packageId);
      if (lastLocation) {
        await updateCourierLocation(packageId, lastLocation.lat, lastLocation.lng, false);
      }
    } catch (error) {
      console.error(`❌ Error saving last location for package ${packageId}:`, error);
    }

    console.log(`✅ Stopped tracking for package ${packageId}`);

    // If no more packages being tracked, remove app state listener
    if (this.trackingIntervals.size === 0 && this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
      this.isTracking = false;
    }
  }

  /**
   * Handle app state changes (foreground/background)
   */
  async handleAppStateChange(nextAppState) {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background - update all tracked packages with last location and offline status
      console.log('📱 App going to background - updating all tracked packages');
      for (const packageId of this.trackingIntervals.keys()) {
        try {
          const lastLocation = await this.getLastLocation(packageId);
          if (lastLocation) {
            await updateCourierLocation(packageId, lastLocation.lat, lastLocation.lng, false);
            await updateCourierStatus(packageId, false);
          }
        } catch (error) {
          console.error(`❌ Error updating package ${packageId} on background:`, error);
        }
      }
    } else if (nextAppState === 'active') {
      // App coming to foreground - update all tracked packages with online status
      console.log('📱 App coming to foreground - updating all tracked packages');
      for (const packageId of this.trackingIntervals.keys()) {
        try {
          const location = await gpsService.getCurrentLocation();
          await this.saveLocation(packageId, location);
          await updateCourierLocation(packageId, location.lat, location.lng, true);
          await updateCourierStatus(packageId, true);
        } catch (error) {
          console.error(`❌ Error updating package ${packageId} on foreground:`, error);
        }
      }
    }
  }

  /**
   * Save location to AsyncStorage
   */
  async saveLocation(packageId, location) {
    try {
      const key = `${LOCATION_STORAGE_KEY}_${packageId}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        timestamp: location.timestamp || Date.now(),
      }));
    } catch (error) {
      console.error(`❌ Error saving location for package ${packageId}:`, error);
    }
  }

  /**
   * Get last saved location from AsyncStorage
   */
  async getLastLocation(packageId) {
    try {
      const key = `${LOCATION_STORAGE_KEY}_${packageId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error(`❌ Error getting last location for package ${packageId}:`, error);
      return null;
    }
  }

  /**
   * Check if currently tracking a package
   */
  isTrackingPackage(packageId) {
    return this.trackingIntervals.has(packageId);
  }

  /**
   * Stop all tracking
   */
  async stopAllTracking() {
    const packageIds = Array.from(this.trackingIntervals.keys());
    for (const packageId of packageIds) {
      await this.stopTracking(packageId);
    }
  }
}

// Export singleton instance
export default new LocationTrackingService();





