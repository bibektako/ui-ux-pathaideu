import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Dimensions,
  Alert,
  Platform,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import packagesService from '../services/packages';
import createAPI from '../services/api';
import gpsService from '../utils/gps';
import CustomMapView from '../components/MapView';
import useAuthStore from '../state/useAuthStore';
import { getImageUri } from '../utils/imageUtils';
import Header from '../components/Header';
import { listenToCourierLocation, removeCourierLocation } from '../services/firebase';
import { useLoading, useToast } from '../context/ToastContext';
import locationTrackingService from '../services/locationTracking';

const { width, height } = Dimensions.get('window');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Estimate time based on distance (assuming average speed of 30 km/h in city)
const estimateTime = (distanceKm) => {
  const avgSpeedKmh = 30;
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  return timeMinutes;
};

const TrackingScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { showLoading, hideLoading } = useLoading();
  const { showError } = useToast();
  const mapRef = useRef(null);
  const [packageData, setPackageData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [courierLocation, setCourierLocation] = useState(null);
  const [isCourierOnline, setIsCourierOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const firebaseUnsubscribe = useRef(null);

  useEffect(() => {
    loadPackage();
    
    // Determine user role and start appropriate tracking
    const initTracking = async () => {
      try {
        const pkg = await packagesService.getById(id);
        const travellerId = pkg.travellerId?._id || pkg.travellerId;
        const isTraveller = travellerId && (travellerId.toString() === user?.id?.toString());
        
        console.log('🔍 Tracking initialization:', {
          packageId: id,
          travellerId: travellerId?.toString(),
          userId: user?.id?.toString(),
          isTraveller
        });
        
        if (isTraveller) {
          // Courier: Start background location tracking
          console.log('✅ User is traveller - starting courier tracking');
          await startCourierTracking();
        } else {
          // Recipient/Sender: Listen to Firebase for courier location
          console.log('👂 User is recipient/sender - starting recipient tracking');
          startRecipientTracking();
        }
      } catch (error) {
        console.error('❌ Error initializing tracking:', error);
      }
    };
    
    // Wait for user to be loaded before initializing
    if (user?.id) {
      initTracking();
    }

    // Cleanup on unmount
    return () => {
      if (firebaseUnsubscribe.current) {
        firebaseUnsubscribe.current();
      }
      // Note: Don't remove location from Firebase on unmount - let it persist
      // Only remove when package is delivered or tracking is explicitly stopped
    };
  }, [id, user?.id]); // Added user?.id to dependencies

  useEffect(() => {
    if (packageData && (currentLocation || courierLocation)) {
      calculateEstimatedTime();
    }
  }, [packageData, currentLocation, courierLocation]);

  const loadPackage = async () => {
    showLoading('Loading package details...');
    try {
      const pkg = await packagesService.getById(id);
      setPackageData(pkg);
    } catch (error) {
      console.error('Error loading package:', error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  /**
   * Start tracking for courier (traveller)
   * Uses locationTrackingService for background tracking
   */
  const startCourierTracking = async () => {
    showLoading('Starting location tracking...');
    try {
      // Start background tracking service
      await locationTrackingService.startTracking(id);
      
      // Get initial location for display
      const initialLocation = await gpsService.getCurrentLocation();
      setCurrentLocation(initialLocation);
      
      // Watch position for UI updates (Firebase updates handled by service)
      const subscription = gpsService.watchPosition((location) => {
        setCurrentLocation(location);
      });

      hideLoading();
      console.log('✅ Courier tracking started (background enabled)');

      return () => {
        if (subscription && subscription.remove) {
          subscription.remove();
        }
      };
    } catch (error) {
      hideLoading();
      console.error('❌ Error starting courier tracking:', error);
      showError('Failed to start location tracking: ' + error.message);
    }
  };

  /**
   * Start tracking for recipient/sender
   * Listens to Firebase for real-time courier location updates
   * Shows last known location if courier is offline
   */
  const startRecipientTracking = async () => {
    try {
      // Try to get last known location from storage first
      const lastLocation = await locationTrackingService.getLastLocation(id);
      if (lastLocation) {
        setCourierLocation({
          lat: lastLocation.lat,
          lng: lastLocation.lng,
          timestamp: lastLocation.timestamp,
        });
      }

      // Listen to Firebase for courier location updates
      firebaseUnsubscribe.current = listenToCourierLocation(id, (location) => {
        setCourierLocation(location);
        setIsCourierOnline(location.isOnline !== false);
        setLastSeen(location.lastSeen || location.timestamp);
        
        // Animate map to courier location
        if (mapRef.current && location.lat && location.lng) {
          mapRef.current.animateToRegion({
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          }, 1000); // 1 second animation
        }
      });
    } catch (error) {
      console.error('Error starting recipient tracking:', error);
    }
  };

  const calculateEstimatedTime = () => {
    if (!packageData) return;

    // Use courier location if available (for recipients), otherwise use current location (for couriers)
    const location = courierLocation || currentLocation;
    if (!location) return;

    // For travellers: calculate time to destination (drop location)
    // For senders: calculate time to destination (to see when package will arrive)
    const targetLat = packageData.destination.coordinates.lat;
    const targetLng = packageData.destination.coordinates.lng;

    const distance = calculateDistance(
      location.lat,
      location.lng,
      targetLat,
      targetLng
    );

    const timeMinutes = estimateTime(distance);
    setEstimatedTime(timeMinutes);
  };

  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) {
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        // Fallback: try with + prefix if it's a number
        const altUrl = `tel:+${cleanPhone}`;
        const canOpenAlt = await Linking.canOpenURL(altUrl);
        if (canOpenAlt) {
          await Linking.openURL(altUrl);
        } else {
          Alert.alert(
            'Cannot Make Call',
            'Phone calls are not available on this device. Please use a physical device to make calls.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error opening phone dialer:', error);
      Alert.alert(
        'Error',
        'Unable to make phone call. This feature requires a physical device.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMoreDetails = () => {
    router.push(`/package-detail/${id}`);
  };

  if (loading || !packageData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Determine if current user is the traveller (delivery person) or sender
  const travellerId = packageData.travellerId?._id || packageData.travellerId;
  const senderId = packageData.senderId?._id || packageData.senderId;
  const isTraveller = travellerId && (travellerId.toString() === user?.id?.toString());
  const isSender = senderId && (senderId.toString() === user?.id?.toString());

  // Get relevant information based on user role
  const traveller = packageData.travellerId || {};
  const sender = packageData.senderId || {};
  
  // For travellers: show drop location details
  // For senders: show delivery person details
  const displayName = isTraveller 
    ? packageData.receiverName || 'Recipient'
    : traveller.name || 'Delivery Person';
  const displayPhone = isTraveller 
    ? packageData.receiverPhone || ''
    : traveller.phone || '';
  const displayLabel = isTraveller ? 'Drop Location' : 'Delivery Person';
  const displayProfileImage = isTraveller ? null : traveller.profileImage;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Header title="Live Tracking" />
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <CustomMapView
          ref={mapRef}
          origin={packageData.origin}
          destination={packageData.destination}
          trackingPoints={packageData.tracking || []}
          currentLocation={courierLocation || currentLocation}
        />
        
        {/* Estimated Time Overlay */}
        {estimatedTime && (isTraveller ? currentLocation : courierLocation) && (
          <View style={styles.timeOverlay}>
            <View style={styles.timeBubble}>
              <Text style={styles.timeText}>{estimatedTime}mins</Text>
              {!isTraveller && !isCourierOnline && (
                <View style={styles.offlineIndicator}>
                  <Ionicons name="cloud-offline-outline" size={12} color="#FF9500" />
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Show message when recipient is waiting for courier location */}
        {!isTraveller && !courierLocation && (
          <View style={styles.waitingOverlay}>
            <View style={styles.waitingBubble}>
              <Ionicons name="location-outline" size={24} color="#007AFF" />
              <Text style={styles.waitingText}>Waiting for traveller to start tracking...</Text>
              <Text style={styles.waitingSubtext}>
                Location will appear here once the traveller opens this screen
              </Text>
            </View>
          </View>
        )}

        {/* Show offline indicator when courier is offline */}
        {!isTraveller && courierLocation && !isCourierOnline && (
          <View style={styles.offlineOverlay}>
            <View style={styles.offlineBubble}>
              <Ionicons name="cloud-offline-outline" size={20} color="#FF9500" />
              <Text style={styles.offlineText}>Traveller is offline</Text>
              <Text style={styles.offlineSubtext}>
                Showing last known location
                {lastSeen && ` (${Math.round((Date.now() - lastSeen) / 60000)} min ago)`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Delivery Details Card */}
      <View style={styles.detailsCard}>
        {/* Person/Location Row - Adapts based on role */}
        <View style={styles.deliveryPersonRow}>
          {!isTraveller && displayProfileImage && (
            <Image
              source={{ uri: getImageUri(displayProfileImage) }}
              style={styles.profileImage}
              onError={(error) => {
                console.error('❌ Tracking profile image error:', error.nativeEvent.error, displayProfileImage);
              }}
            />
          )}
          {!isTraveller && !displayProfileImage && (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profilePlaceholderText}>
                {(displayName || 'D').substring(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.deliveryPersonName}>{displayName}</Text>
            {isTraveller && (
              <Text style={styles.subtitleText}>
                {packageData.destination?.city}, {packageData.destination?.address}
              </Text>
            )}
          </View>
          {displayPhone && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(displayPhone)}
            >
              <Ionicons name="call-outline" size={20} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Estimated Time Row */}
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="time-outline" size={18} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Estimated time</Text>
          </View>
          <Text style={styles.detailValue}>
            {estimatedTime ? `${estimatedTime}mins` : 'Calculating...'}
          </Text>
        </View>

        {/* Location/Person Row - Adapts based on role */}
        {isTraveller ? (
          // For travellers: Show drop location details
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="location-outline" size={18} color="#666" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Drop location</Text>
            </View>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>
                {packageData.destination?.city}, {packageData.destination?.address}
              </Text>
            </View>
          </View>
        ) : (
          // For senders: Show delivery person
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="person-outline" size={18} color="#666" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Deliver to</Text>
            </View>
            <Text style={styles.detailValue}>{packageData.receiverName || 'Recipient'}</Text>
          </View>
        )}
      </View>

      {/* More Details Button */}
      <TouchableOpacity style={styles.moreDetailsButton} onPress={handleMoreDetails}>
        <Text style={styles.moreDetailsText}>More details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  headerContainer: {
    backgroundColor: '#fff',
    zIndex: 10
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  timeOverlay: {
    position: 'absolute',
    top: '40%',
    right: '20%',
    zIndex: 1000
  },
  timeBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  },
  waitingOverlay: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    zIndex: 1000,
    alignItems: 'center'
  },
  waitingBubble: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    maxWidth: 300
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    textAlign: 'center'
  },
  waitingSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18
  },
  offlineOverlay: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    zIndex: 1000,
    alignItems: 'center'
  },
  offlineBubble: {
    backgroundColor: '#FFF4E6',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    maxWidth: 280
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginTop: 8,
    textAlign: 'center'
  },
  offlineSubtext: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 4,
    textAlign: 'center'
  },
  offlineIndicator: {
    marginLeft: 4
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  deliveryPersonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E0E0E0'
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  profilePlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  nameContainer: {
    flex: 1,
    marginRight: 8
  },
  deliveryPersonName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  subtitleText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  detailIcon: {
    marginRight: 8
  },
  detailLabel: {
    fontSize: 14,
    color: '#666'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flexShrink: 1,
    marginLeft: 8,
    textAlign: 'right'
  },
  detailValueContainer: {
    flex: 1,
    alignItems: 'flex-end'
  },
  moreDetailsButton: {
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  moreDetailsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000'
  }
});

export default TrackingScreen;
