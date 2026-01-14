import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import gpsService from '../utils/gps';

const MapLocationPicker = ({ 
  visible, 
  onClose, 
  onSelect, 
  initialLocation = null,
  title = 'Select Location'
}) => {
  const [region, setRegion] = useState({
    latitude: 27.7172,
    longitude: 85.3240,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (visible) {
      loadCurrentLocation();
    }
  }, [visible]);

  const loadCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await gpsService.getCurrentLocation();
      const addr = await gpsService.reverseGeocode(location.lat, location.lng);
      
      setRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      
      setSelectedLocation({
        lat: location.lat,
        lng: location.lng,
      });
      
      setAddress(`${addr.address}, ${addr.city}`);
    } catch (error) {
      console.error('Error loading location:', error);
      // Use default location (Kathmandu)
      if (initialLocation) {
        setRegion({
          latitude: initialLocation.lat,
          longitude: initialLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setSelectedLocation(initialLocation);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ lat: latitude, lng: longitude });
    
    try {
      const addr = await gpsService.reverseGeocode(latitude, longitude);
      setAddress(`${addr.address}, ${addr.city}`);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddress('Location selected');
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect({
        coordinates: selectedLocation,
        address: address,
      });
      onClose();
    } else {
      Alert.alert('Error', 'Please select a location on the map');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={loadCurrentLocation} style={styles.locationButton}>
            <Ionicons name="locate" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              region={region}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                  }}
                  title="Selected Location"
                  pinColor="#007AFF"
                />
              )}
            </MapView>
          )}
        </View>

        {/* Address Display */}
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Tap on map to select location'}
          </Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapLocationPicker;








