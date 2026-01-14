import * as Location from 'expo-location';

const gpsService = {
  requestPermissions: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('❌ Location permission denied. Status:', status);
      throw new Error('Location permission denied');
    }
    console.log('✅ Location permissions granted');
    return true;
  },

  getCurrentLocation: async () => {
    const hasPermission = await gpsService.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: new Date()
    };
  },

  watchPosition: (callback) => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10
      },
      (location) => {
        callback({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          timestamp: new Date()
        });
      }
    );
  },

  reverseGeocode: async (lat, lng) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (addresses.length > 0) {
        const addr = addresses[0];
        return {
          city: addr.city || addr.subAdministrativeArea || '',
          address: `${addr.street || ''} ${addr.streetNumber || ''}`.trim() || addr.name || ''
        };
      }
      return { city: '', address: '' };
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return { city: '', address: '' };
    }
  }
};

export default gpsService;














