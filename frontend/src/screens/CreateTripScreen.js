import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import tripsService from '../services/trips';
import gpsService from '../utils/gps';

const CreateTripScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: { city: '', address: '', coordinates: { lat: 0, lng: 0 } },
    destination: { city: '', address: '', coordinates: { lat: 0, lng: 0 } },
    departureDate: '',
    departureTime: '',
    capacity: '1',
    price: ''
  });

  const getCurrentLocation = async (type) => {
    try {
      const location = await gpsService.getCurrentLocation();
      const address = await gpsService.reverseGeocode(location.lat, location.lng);
      
      setFormData(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          city: address.city,
          address: address.address,
          coordinates: { lat: location.lat, lng: location.lng }
        }
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please enable location services.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.origin.city || !formData.destination.city || !formData.departureDate ||
        !formData.capacity || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime || '12:00'}`);
      
      const tripData = {
        origin: {
          ...formData.origin,
          coordinates: formData.origin.coordinates
        },
        destination: {
          ...formData.destination,
          coordinates: formData.destination.coordinates
        },
        departureDate: departureDateTime.toISOString(),
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price)
      };

      await tripsService.create(tripData);
      Alert.alert('Success', 'Trip created successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Trip</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origin</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => getCurrentLocation('origin')}
          >
            <Text style={styles.locationButtonText}> Use Current Location</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="City"
            value={formData.origin.city}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              origin: { ...prev.origin, city: text }
            }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={formData.origin.address}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              origin: { ...prev.origin, address: text }
            }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination</Text>
          <TextInput
            style={styles.input}
            placeholder="City"
            value={formData.destination.city}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              destination: { ...prev.destination, city: text }
            }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={formData.destination.address}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              destination: { ...prev.destination, address: text }
            }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Departure</Text>
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={formData.departureDate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, departureDate: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Time (HH:MM) - Optional"
            value={formData.departureTime}
            onChangeText={(text) => setFormData(prev => ({ ...prev, departureTime: text }))}
          />
        </View>

        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Capacity (number of packages)"
            value={formData.capacity}
            onChangeText={(text) => setFormData(prev => ({ ...prev, capacity: text }))}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Price per package"
            value={formData.price}
            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
            keyboardType="decimal-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Trip</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default CreateTripScreen;













