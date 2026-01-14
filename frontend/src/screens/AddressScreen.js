import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import addressService from '../services/address';
import gpsService from '../utils/gps';
import MapLocationPicker from '../components/MapLocationPicker';
import { useToast, useLoading } from '../context/ToastContext';
import Header from '../components/Header';

const AddressScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();
  
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [errors, setErrors] = useState({
    city: '',
    address: ''
  });

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    try {
      setLoadingAddress(true);
      const currentAddress = await addressService.get();
      if (currentAddress) {
        setCity(currentAddress.city || '');
        setAddress(currentAddress.address || '');
        if (currentAddress.coordinates) {
          setCoordinates({
            lat: currentAddress.coordinates.lat || 0,
            lng: currentAddress.coordinates.lng || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading address:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const validateCity = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, city: 'City is required' }));
      return false;
    }
    setErrors(prev => ({ ...prev, city: '' }));
    return true;
  };

  const validateAddress = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, address: 'Address is required' }));
      return false;
    }
    setErrors(prev => ({ ...prev, address: '' }));
    return true;
  };

  const handleUseCurrentLocation = async () => {
    try {
      showLoading('Getting your current location...');
      const location = await gpsService.getCurrentLocation();
      const addr = await gpsService.reverseGeocode(location.lat, location.lng);
      
      setCity(addr.city || '');
      setAddress(addr.address || '');
      setCoordinates({
        lat: location.lat,
        lng: location.lng
      });
      
      // Clear errors
      setErrors({ city: '', address: '' });
      
      hideLoading();
      showSuccess('Location set successfully!');
    } catch (error) {
      hideLoading();
      console.error('Error getting location:', error);
      showError('Failed to get your location. Please check location permissions.');
    }
  };

  const handleMapSelect = (locationData) => {
    const addrParts = locationData.address.split(',').map(s => s.trim());
    setCity(addrParts[addrParts.length - 1] || addrParts[0] || '');
    setAddress(locationData.address);
    setCoordinates(locationData.coordinates);
    setShowMapPicker(false);
    setErrors({ city: '', address: '' });
  };

  const handleSave = async () => {
    // Validate
    const isCityValid = validateCity(city);
    const isAddressValid = validateAddress(address);

    if (!isCityValid || !isAddressValid) {
      showError('Please fill in all required fields');
      return;
    }

    if (!coordinates.lat || !coordinates.lng) {
      showError('Please select a location on the map or use your current location');
      return;
    }

    setLoading(true);
    showLoading('Saving address...');
    try {
      const response = await addressService.update(city, address, coordinates);
      setVerificationId(response.verificationId);
      hideLoading();
      setShowVerificationModal(true);
      showSuccess('Verification code sent to your email!');
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    showLoading('Verifying address...');
    try {
      await addressService.verify(verificationId, verificationCode);
      hideLoading();
      setShowVerificationModal(false);
      setVerificationCode('');
      showSuccess('Address verified and saved successfully!');
      
      // Reload address to show updated data
      await loadAddress();
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAddress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading address...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Permanent Address" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Add or update your permanent address. A verification code will be sent to your email.
          </Text>
        </View>

        {/* Use Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
        >
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.currentLocationText}>Use My Current Location</Text>
        </TouchableOpacity>

        {/* City Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Enter city"
              placeholderTextColor="#BDC3C7"
              value={city}
              onChangeText={(text) => {
                setCity(text);
                if (errors.city) {
                  validateCity(text);
                }
              }}
              onBlur={() => validateCity(city)}
            />
          </View>
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
        </View>

        {/* Address Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.address && styles.inputError, styles.addressInput]}
              placeholder="Enter full address"
              placeholderTextColor="#BDC3C7"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (errors.address) {
                  validateAddress(text);
                }
              }}
              onBlur={() => validateAddress(address)}
              multiline
              numberOfLines={3}
            />
          </View>
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
        </View>

        {/* Select on Map Button */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowMapPicker(true)}
        >
          <Ionicons name="map-outline" size={20} color="#007AFF" />
          <Text style={styles.mapButtonText}>Select Location on Map</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Address</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Location Picker Modal */}
      <MapLocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelect={handleMapSelect}
        initialLocation={coordinates.lat && coordinates.lng ? coordinates : null}
        title="Select Permanent Address Location"
      />

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Address</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVerificationModal(false);
                  setVerificationCode('');
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              A verification code has been sent to your email. Please enter it below to confirm your address.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#BDC3C7"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={async () => {
                // Resend verification
                try {
                  showLoading('Resending verification code...');
                  const response = await addressService.update(city, address, coordinates);
                  setVerificationId(response.verificationId);
                  hideLoading();
                  showSuccess('Verification code resent!');
                } catch (error) {
                  hideLoading();
                  showError('Failed to resend code. Please try again.');
                }
              }}
            >
              <Text style={styles.resendButtonText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: '#F44336',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  mapButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default AddressScreen;

