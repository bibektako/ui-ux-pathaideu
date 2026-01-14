import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import packagesService from '../services/packages';
import gpsService from '../utils/gps';
import useAuthStore from '../state/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import createAPI from '../services/api';
import MapLocationPicker from '../components/MapLocationPicker';
import { useToast, useLoading } from '../context/ToastContext';
import Header from '../components/Header';

// Nepal locations list
const NEPAL_LOCATIONS = [
  // Major Cities
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Birgunj', 
  'Butwal', 'Dharan', 'Hetauda', 'Janakpur', 'Nepalgunj', 'Itahari', 'Dhulikhel',
  'Bharatpur', 'Bhimdatta', 'Tulsipur', 'Ghorahi', 'Siddharthanagar', 'Birendranagar',
  // Kathmandu Areas
  'Thamel, Kathmandu', 'Durbar Square, Kathmandu', 'Patan, Lalitpur', 'Boudha, Kathmandu',
  'Swayambhunath, Kathmandu', 'Pashupatinath, Kathmandu', 'New Road, Kathmandu',
  'Kalimati, Kathmandu', 'Kalanki, Kathmandu', 'Baneshwor, Kathmandu', 'Gongabu, Kathmandu',
  'Koteshwor, Kathmandu', 'Jawalakhel, Lalitpur', 'Pulchowk, Lalitpur', 'Lagankhel, Lalitpur',
  'Bhaktapur Durbar Square, Bhaktapur', 'Thimi, Bhaktapur',
  // Pokhara Areas
  'Lakeside, Pokhara', 'Phewa Lake, Pokhara', 'Fewa Lake, Pokhara', 'Mahendrapul, Pokhara',
  'Chipledhunga, Pokhara', 'Baidam, Pokhara',
  // Other Popular Locations
  'Chitwan', 'Lumbini', 'Nagarkot', 'Bandipur', 'Gorkha', 'Mustang', 'Annapurna Base Camp',
  'Everest Base Camp', 'Sagarmatha', 'Langtang', 'Manang', 'Jomsom', 'Muktinath'
];

const QUANTITY_OPTIONS = ['1', '2', '3', '4', '5'];

const CreatePackageScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [packageDetailsCompleted, setPackageDetailsCompleted] = useState(false);
  const [locationCompleted, setLocationCompleted] = useState(false);
  const [showPackageTypeModal, setShowPackageTypeModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDropoffPicker, setShowDropoffPicker] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupCoordinates: { lat: 0, lng: 0 },
    dropoffCoordinates: { lat: 0, lng: 0 },
    itemName: '',
    quantity: '1',
    packageType: '',
    receiverName: '',
    receiverPhone: '',
    payer: 'sender',
    fee: '',
    packagePhoto: null
  });

  // Pre-fill form data if relisting or editing
  useEffect(() => {
    if (params.relist === 'true' || params.edit === 'true') {
      setFormData(prev => ({
        ...prev,
        itemName: params.itemName || '',
        quantity: params.quantity || '1',
        receiverName: params.receiverName || '',
        receiverPhone: params.receiverPhone || '',
        pickupLocation: params.pickupAddress ? `${params.pickupCity || ''}, ${params.pickupAddress}`.trim() : (params.pickupCity || ''),
        dropoffLocation: params.dropoffAddress ? `${params.dropoffCity || ''}, ${params.dropoffAddress}`.trim() : (params.dropoffCity || ''),
        pickupCoordinates: {
          lat: params.pickupLat ? parseFloat(params.pickupLat) : 0,
          lng: params.pickupLng ? parseFloat(params.pickupLng) : 0
        },
        dropoffCoordinates: {
          lat: params.dropoffLat ? parseFloat(params.dropoffLat) : 0,
          lng: params.dropoffLng ? parseFloat(params.dropoffLng) : 0
        },
        fee: params.fee || '',
        payer: params.payer || 'sender'
      }));

      // If coordinates are available, mark location as completed
      if (params.pickupLat && params.dropoffLat) {
        setLocationCompleted(true);
      }

      // If basic details are available, mark package details as completed
      if (params.itemName && params.receiverName && params.receiverPhone && params.fee) {
        setPackageDetailsCompleted(true);
        // Auto-advance to location tab if details are complete
        if (params.pickupLat && params.dropoffLat) {
          setActiveTab('photo');
        } else {
          setActiveTab('location');
        }
      }

      // Load photos if available
      if (params.photos) {
        const photoUrls = params.photos.split(',').filter(url => url.trim());
        if (photoUrls.length > 0) {
          setFormData(prev => ({
            ...prev,
            packagePhoto: photoUrls[0] // Use first photo
          }));
        }
      }

      if (params.edit === 'true') {
        showSuccess('Package details loaded. Review and update to save changes.');
      } else {
        showSuccess('Package details loaded. Review and submit to relist.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.relist, params.edit]);

  // Error states for all fields
  const [errors, setErrors] = useState({
    itemName: '',
    quantity: '',
    receiverName: '',
    receiverPhone: '',
    fee: '',
    pickupLocation: '',
    dropoffLocation: ''
  });

  const packageTypes = ['Documents', 'Electronics', 'Clothing', 'Food', 'Other'];

  // Validation functions
  const validateItemName = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, itemName: 'Item name is required' }));
      showError('Item name is required');
      return false;
    }
    setErrors(prev => ({ ...prev, itemName: '' }));
    return true;
  };

  const validateQuantity = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, quantity: 'Quantity is required' }));
      showError('Quantity is required');
      return false;
    }
    setErrors(prev => ({ ...prev, quantity: '' }));
    return true;
  };

  const validateReceiverName = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, receiverName: 'Receiver name is required' }));
      showError('Receiver name is required');
      return false;
    }
    setErrors(prev => ({ ...prev, receiverName: '' }));
    return true;
  };

  const validateReceiverPhone = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, receiverPhone: 'Receiver phone is required' }));
      showError('Receiver phone is required');
      return false;
    }
    // Remove any non-digit characters for validation
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setErrors(prev => ({ ...prev, receiverPhone: 'Phone number must be 10 digits' }));
      showError('Phone number must be exactly 10 digits');
      return false;
    }
    setErrors(prev => ({ ...prev, receiverPhone: '' }));
    return true;
  };

  const validateFee = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, fee: 'Price is required' }));
      showError('Price is required');
      return false;
    }
    const feeNumber = parseFloat(value);
    if (Number.isNaN(feeNumber) || feeNumber <= 0) {
      setErrors(prev => ({ ...prev, fee: 'Please enter a valid price' }));
      showError('Please enter a valid price');
      return false;
    }
    setErrors(prev => ({ ...prev, fee: '' }));
    return true;
  };

  const validatePickupLocation = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, pickupLocation: 'Pickup location is required' }));
      showError('Pickup location is required');
      return false;
    }
    setErrors(prev => ({ ...prev, pickupLocation: '' }));
    return true;
  };

  const validateDropoffLocation = (value) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, dropoffLocation: 'Drop-off location is required' }));
      showError('Drop-off location is required');
      return false;
    }
    setErrors(prev => ({ ...prev, dropoffLocation: '' }));
    return true;
  };

  // Validate Package Details section
  const isPackageDetailsValid = () => {
    return (
      formData.itemName.trim() !== '' &&
      formData.quantity.trim() !== '' &&
      formData.receiverName.trim() !== '' &&
      formData.receiverPhone.trim() !== '' &&
      formData.receiverPhone.replace(/\D/g, '').length === 10 &&
      formData.fee.trim() !== '' &&
      parseFloat(formData.fee) > 0 &&
      errors.itemName === '' &&
      errors.quantity === '' &&
      errors.receiverName === '' &&
      errors.receiverPhone === '' &&
      errors.fee === ''
    );
  };

  // Validate Location section
  const isLocationValid = () => {
    return (
      formData.pickupLocation.trim() !== '' &&
      formData.dropoffLocation.trim() !== '' &&
      errors.pickupLocation === '' &&
      errors.dropoffLocation === ''
    );
  };

  const handleTabChange = (tab) => {
    // Prevent navigation to Location if Package Details is not completed
    if (tab === 'location' && !packageDetailsCompleted) {
      showError('Please complete Package Details and click Next before proceeding to Location');
      return;
    }
    // Prevent navigation to Photo if Location is not completed
    if (tab === 'photo' && !locationCompleted) {
      showError('Please complete Location and click Next before proceeding to Package Photo');
      return;
    }
    setActiveTab(tab);
  };

  const handleNext = () => {
    if (activeTab === 'details') {
      // Validate all Package Details fields
      const isItemNameValid = validateItemName(formData.itemName);
      const isQuantityValid = validateQuantity(formData.quantity);
      const isReceiverNameValid = validateReceiverName(formData.receiverName);
      const isReceiverPhoneValid = validateReceiverPhone(formData.receiverPhone);
      const isFeeValid = validateFee(formData.fee);

      if (!isItemNameValid || !isQuantityValid || !isReceiverNameValid || 
          !isReceiverPhoneValid || !isFeeValid) {
        return;
      }

      // All validations passed
      setPackageDetailsCompleted(true);
      setActiveTab('location');
      showSuccess('Package details saved! Now fill in the location.');
    } else if (activeTab === 'location') {
      // Validate all Location fields
      const isPickupValid = validatePickupLocation(formData.pickupLocation);
      const isDropoffValid = validateDropoffLocation(formData.dropoffLocation);

      if (!isPickupValid || !isDropoffValid) {
        return;
      }

      // All validations passed
      setLocationCompleted(true);
      setActiveTab('photo');
      showSuccess('Location saved! Now upload package photo.');
    }
  };

  const filterLocations = (query) => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return NEPAL_LOCATIONS.filter(location => 
      location.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  };

  const handlePickupInputChange = (text) => {
    setFormData(prev => ({ ...prev, pickupLocation: text }));
    if (errors.pickupLocation) {
      validatePickupLocation(text);
    }
    const suggestions = filterLocations(text);
    setPickupSuggestions(suggestions);
    setShowPickupSuggestions(suggestions.length > 0 && text.length > 0);
  };

  const handleDropoffInputChange = (text) => {
    setFormData(prev => ({ ...prev, dropoffLocation: text }));
    if (errors.dropoffLocation) {
      validateDropoffLocation(text);
    }
    const suggestions = filterLocations(text);
    setDropoffSuggestions(suggestions);
    setShowDropoffSuggestions(suggestions.length > 0 && text.length > 0);
  };

  const selectPickupSuggestion = (location) => {
    setFormData(prev => ({ ...prev, pickupLocation: location }));
    validatePickupLocation(location);
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
    if (pickupInputRef.current) {
      pickupInputRef.current.blur();
    }
  };

  const selectDropoffSuggestion = (location) => {
    setFormData(prev => ({ ...prev, dropoffLocation: location }));
    validateDropoffLocation(location);
    setShowDropoffSuggestions(false);
    setDropoffSuggestions([]);
    if (dropoffInputRef.current) {
      dropoffInputRef.current.blur();
    }
  };

  const handleLocationSelect = (type, locationData) => {
    if (type === 'pickup') {
      setFormData(prev => ({
        ...prev,
        pickupLocation: locationData.address,
        pickupCoordinates: locationData.coordinates
      }));
      validatePickupLocation(locationData.address);
      setShowPickupPicker(false);
    } else {
      setFormData(prev => ({
        ...prev,
        dropoffLocation: locationData.address,
        dropoffCoordinates: locationData.coordinates
      }));
      validateDropoffLocation(locationData.address);
      setShowDropoffPicker(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, packagePhoto: result.assets[0] }));
      }
    } catch (error) {
      showError('Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isItemNameValid = validateItemName(formData.itemName);
    const isQuantityValid = validateQuantity(formData.quantity);
    const isReceiverNameValid = validateReceiverName(formData.receiverName);
    const isReceiverPhoneValid = validateReceiverPhone(formData.receiverPhone);
    const isFeeValid = validateFee(formData.fee);
    const isPickupValid = validatePickupLocation(formData.pickupLocation);
    const isDropoffValid = validateDropoffLocation(formData.dropoffLocation);

    if (!isItemNameValid || !isQuantityValid || !isReceiverNameValid || 
        !isReceiverPhoneValid || !isFeeValid || !isPickupValid || !isDropoffValid) {
      return;
    }

    setLoading(true);
    try {
      // Parse locations to extract city and address
      const pickupParts = formData.pickupLocation.split(',').map(s => s.trim());
      const dropoffParts = formData.dropoffLocation.split(',').map(s => s.trim());
      
      const packageData = {
        origin: {
          city: pickupParts[pickupParts.length - 1] || pickupParts[0],
          address: formData.pickupLocation,
          coordinates: formData.pickupCoordinates.lat ? formData.pickupCoordinates : { lat: 0, lng: 0 }
        },
        destination: {
          city: dropoffParts[dropoffParts.length - 1] || dropoffParts[0],
          address: formData.dropoffLocation,
          coordinates: formData.dropoffCoordinates.lat ? formData.dropoffCoordinates : { lat: 0, lng: 0 }
        },
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone.replace(/\D/g, ''), // Store only digits
        description: `${formData.itemName} (Qty: ${formData.quantity}, Type: ${formData.packageType || 'N/A'})`,
        fee: parseFloat(formData.fee),
        payer: formData.payer,
        photos: []
      };

      // Upload photo if selected
      if (formData.packagePhoto) {
        showLoading('Uploading photo...');
        try {
          const api = createAPI();
          const formDataUpload = new FormData();
          formDataUpload.append('files', {
            uri: formData.packagePhoto.uri,
            type: 'image/jpeg',
            name: 'package.jpg'
          });
          formDataUpload.append('type', 'package_photo');

          const uploadResponse = await api.post('/api/submissions', formDataUpload, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (uploadResponse.data.submission?.files?.[0]) {
            packageData.photos = [uploadResponse.data.submission.files[0]];
          }
        } catch (error) {
          console.error('Photo upload failed:', error);
        }
      }

      showLoading(params.edit === 'true' ? 'Updating package...' : 'Saving package...');
      
      if (params.edit === 'true' && params.packageId) {
        // Update existing package
        await packagesService.update(params.packageId, packageData);
        hideLoading();
        showSuccess('Package updated successfully!');
      } else {
        // Create new package
        await packagesService.create(packageData);
        hideLoading();
        showSuccess('Package request created successfully!');
      }
      
      setTimeout(() => router.back(), 1000);
    } catch (error) {
      hideLoading();
      const errorMessage = params.edit === 'true' 
        ? (error.response?.data?.error || error.message || 'Failed to update package')
        : (error.response?.data?.error || error.message || 'Failed to create package');
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if phone number is valid (10 digits)
  const isPhoneValid = () => {
    const digitsOnly = formData.receiverPhone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const renderPackageDetails = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput
            style={[styles.input, errors.itemName && styles.inputError]}
            placeholder="e.g., Documents, Electronics"
            placeholderTextColor="#999"
            value={formData.itemName}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, itemName: text }));
              if (errors.itemName) {
                validateItemName(text);
              }
            }}
            onBlur={() => validateItemName(formData.itemName)}
          />
          {errors.itemName ? <Text style={styles.errorText}>{errors.itemName}</Text> : null}
        </View>

        <View style={styles.detailsRow}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Quantity *</Text>
            <TouchableOpacity
              style={[styles.selectInput, errors.quantity && styles.inputError]}
              onPress={() => setShowQuantityModal(true)}
            >
              <Text style={[styles.selectText, !formData.quantity && styles.placeholderText]}>
                {formData.quantity || 'Select'}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Package Type</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowPackageTypeModal(true)}
            >
              <Text style={[styles.selectText, !formData.packageType && styles.placeholderText]}>
                {formData.packageType || 'Select'}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (Rs) *</Text>
          <TextInput
            style={[styles.input, errors.fee && styles.inputError]}
            placeholder="Enter price"
            placeholderTextColor="#999"
            value={formData.fee}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, fee: text }));
              if (errors.fee) {
                validateFee(text);
              }
            }}
            onBlur={() => validateFee(formData.fee)}
            keyboardType="decimal-pad"
          />
          {errors.fee ? <Text style={styles.errorText}>{errors.fee}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Receiver Name *</Text>
          <TextInput
            style={[styles.input, errors.receiverName && styles.inputError]}
            placeholder="Enter receiver name"
            placeholderTextColor="#999"
            value={formData.receiverName}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, receiverName: text }));
              if (errors.receiverName) {
                validateReceiverName(text);
              }
            }}
            onBlur={() => validateReceiverName(formData.receiverName)}
          />
          {errors.receiverName ? <Text style={styles.errorText}>{errors.receiverName}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Receiver Phone *</Text>
          <TextInput
            style={[
              styles.input,
              (errors.receiverPhone || (formData.receiverPhone && !isPhoneValid())) && styles.inputError
            ]}
            placeholder="Enter 10-digit phone number"
            placeholderTextColor="#999"
            value={formData.receiverPhone}
            onChangeText={(text) => {
              // Allow only digits and limit to 10
              const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
              setFormData(prev => ({ ...prev, receiverPhone: digitsOnly }));
              if (errors.receiverPhone) {
                validateReceiverPhone(digitsOnly);
              }
            }}
            onBlur={() => validateReceiverPhone(formData.receiverPhone)}
            keyboardType="phone-pad"
            maxLength={10}
          />
          {errors.receiverPhone || (formData.receiverPhone && !isPhoneValid()) ? (
            <Text style={styles.errorText}>
              {errors.receiverPhone || 'Phone number must be 10 digits'}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.paymentQuestion}>Who will pay for this delivery?</Text>
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                formData.payer === 'sender' && styles.paymentButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, payer: 'sender' }))}
            >
              <Text style={[
                styles.paymentButtonText,
                formData.payer === 'sender' && styles.paymentButtonTextActive
              ]}>
                I'll Pay
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                formData.payer === 'receiver' && styles.paymentButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, payer: 'receiver' }))}
            >
              <Text style={[
                styles.paymentButtonText,
                formData.payer === 'receiver' && styles.paymentButtonTextActive
              ]}>
                Receiver Pays
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderLocation = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pickup Location *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={pickupInputRef}
              style={[styles.textInput, errors.pickupLocation && styles.inputError]}
              placeholder="Enter pickup location (e.g., Thamel, Kathmandu)"
              placeholderTextColor="#999"
              value={formData.pickupLocation}
              onChangeText={handlePickupInputChange}
              onFocus={() => {
                if (formData.pickupLocation) {
                  const suggestions = filterLocations(formData.pickupLocation);
                  setPickupSuggestions(suggestions);
                  setShowPickupSuggestions(suggestions.length > 0);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowPickupSuggestions(false);
                  validatePickupLocation(formData.pickupLocation);
                }, 200);
              }}
            />
            <TouchableOpacity
              style={styles.mapIconButton}
              onPress={() => setShowPickupPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showPickupSuggestions && pickupSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {pickupSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`pickup-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => selectPickupSuggestion(item)}
                  >
                    <Ionicons name="location" size={16} color="#007AFF" />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {errors.pickupLocation ? <Text style={styles.errorText}>{errors.pickupLocation}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Drop-off Location *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={dropoffInputRef}
              style={[styles.textInput, errors.dropoffLocation && styles.inputError]}
              placeholder="Enter drop-off location (e.g., Lakeside, Pokhara)"
              placeholderTextColor="#999"
              value={formData.dropoffLocation}
              onChangeText={handleDropoffInputChange}
              onFocus={() => {
                if (formData.dropoffLocation) {
                  const suggestions = filterLocations(formData.dropoffLocation);
                  setDropoffSuggestions(suggestions);
                  setShowDropoffSuggestions(suggestions.length > 0);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowDropoffSuggestions(false);
                  validateDropoffLocation(formData.dropoffLocation);
                }, 200);
              }}
            />
            <TouchableOpacity
              style={styles.mapIconButton}
              onPress={() => setShowDropoffPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {dropoffSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`dropoff-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => selectDropoffSuggestion(item)}
                  >
                    <Ionicons name="location" size={16} color="#007AFF" />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {errors.dropoffLocation ? <Text style={styles.errorText}>{errors.dropoffLocation}</Text> : null}
        </View>
      </View>
    </ScrollView>
  );

  const renderPackagePhoto = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.photoInstruction}>Upload a photo of your package.</Text>
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={handlePhotoUpload}
          activeOpacity={0.7}
        >
          {formData.packagePhoto ? (
            <Image
              source={{ uri: formData.packagePhoto.uri }}
              style={styles.uploadedImage}
              resizeMode="cover"
            />
          ) : (
            <>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload-outline" size={40} color="#999" />
              </View>
              <Text style={styles.uploadText}>Click to upload or drag and drop</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title={params.edit === 'true' ? 'Edit Package' : 'Send Package'} />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('details')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'details' && styles.tabTextActive
          ]}>
            Package Details
          </Text>
          {activeTab === 'details' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('location')}
          activeOpacity={0.7}
          disabled={!packageDetailsCompleted}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'location' && styles.tabTextActive,
            !packageDetailsCompleted && styles.tabTextDisabled
          ]}>
            Location
          </Text>
          {activeTab === 'location' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('photo')}
          activeOpacity={0.7}
          disabled={!locationCompleted}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'photo' && styles.tabTextActive,
            !locationCompleted && styles.tabTextDisabled
          ]}>
            Package photo
          </Text>
          {activeTab === 'photo' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'details' && renderPackageDetails()}
      {activeTab === 'location' && renderLocation()}
      {activeTab === 'photo' && renderPackagePhoto()}

      {/* Action Button */}
      <View style={styles.submitButtonContainer}>
        {activeTab === 'photo' ? (
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {params.edit === 'true' ? 'Update Package' : 'Create Request'}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              styles.nextButton,
              (activeTab === 'details' && !isPackageDetailsValid()) && styles.buttonDisabled,
              (activeTab === 'location' && !isLocationValid()) && styles.buttonDisabled
            ]}
            onPress={handleNext}
            disabled={
              (activeTab === 'details' && !isPackageDetailsValid()) ||
              (activeTab === 'location' && !isLocationValid())
            }
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quantity Modal */}
      <Modal
        visible={showQuantityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Quantity</Text>
            {QUANTITY_OPTIONS.map((qty) => (
              <TouchableOpacity
                key={qty}
                style={styles.modalOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, quantity: qty }));
                  validateQuantity(qty);
                  setShowQuantityModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{qty}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowQuantityModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Package Type Modal */}
      <Modal
        visible={showPackageTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPackageTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Package Type</Text>
            {packageTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, packageType: type }));
                  setShowPackageTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPackageTypeModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Map Location Pickers */}
      <MapLocationPicker
        visible={showPickupPicker}
        onClose={() => setShowPickupPicker(false)}
        onSelect={(locationData) => handleLocationSelect('pickup', locationData)}
        initialLocation={formData.pickupCoordinates.lat ? formData.pickupCoordinates : null}
        title="Select Pickup Location"
      />

      <MapLocationPicker
        visible={showDropoffPicker}
        onClose={() => setShowDropoffPicker(false)}
        onSelect={(locationData) => handleLocationSelect('dropoff', locationData)}
        initialLocation={formData.dropoffCoordinates.lat ? formData.dropoffCoordinates : null}
        title="Select Drop-off Location"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingTop: 10
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative'
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  tabTextDisabled: {
    color: '#999',
    opacity: 0.5
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#007AFF'
  },
  tabContent: {
    flexGrow: 1,
    padding: 15,
    paddingBottom: 100
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333'
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfWidth: {
    flex: 1
  },
  selectInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectText: {
    fontSize: 16,
    color: '#333'
  },
  placeholderText: {
    color: '#999'
  },
  selectArrow: {
    fontSize: 12,
    color: '#999'
  },
  paymentQuestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 10
  },
  paymentButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  paymentButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  paymentButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  paymentButtonTextActive: {
    color: '#fff'
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333'
  },
  mapIconButton: {
    position: 'absolute',
    right: 12,
    padding: 4
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  photoInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    minHeight: 150
  },
  uploadIconContainer: {
    marginBottom: 10
  },
  uploadText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  submitButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 30
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center'
  },
  nextButton: {
    backgroundColor: '#007AFF'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333'
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333'
  },
  modalCancel: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  }
});

export default CreatePackageScreen;
