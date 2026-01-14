import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tripsService from '../services/trips';
import gpsService from '../utils/gps';
import DatePicker from '../components/DatePicker';
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

const CreateTripScreen = () => {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const [formData, setFormData] = useState({
    origin: { city: '', address: '', coordinates: { lat: 0, lng: 0 } },
    destination: { city: '', address: '', coordinates: { lat: 0, lng: 0 } },
    departureDate: null,
    departureTime: null,
    capacity: '1',
    price: ''
  });

  const filterLocations = (query) => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return NEPAL_LOCATIONS.filter(location => 
      location.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  };

  const handleOriginInputChange = (text) => {
    const parts = text.split(',').map(s => s.trim());
    setFormData(prev => ({
      ...prev,
      origin: {
        ...prev.origin,
        address: text,
        city: parts[parts.length - 1] || parts[0] || ''
      }
    }));
    const suggestions = filterLocations(text);
    setOriginSuggestions(suggestions);
    setShowOriginSuggestions(suggestions.length > 0 && text.length > 0);
  };

  const handleDestinationInputChange = (text) => {
    const parts = text.split(',').map(s => s.trim());
    setFormData(prev => ({
      ...prev,
      destination: {
        ...prev.destination,
        address: text,
        city: parts[parts.length - 1] || parts[0] || ''
      }
    }));
    const suggestions = filterLocations(text);
    setDestinationSuggestions(suggestions);
    setShowDestinationSuggestions(suggestions.length > 0 && text.length > 0);
  };

  const selectOriginSuggestion = (location) => {
    const parts = location.split(',').map(s => s.trim());
    setFormData(prev => ({
      ...prev,
      origin: {
        ...prev.origin,
        address: location,
        city: parts[parts.length - 1] || parts[0] || ''
      }
    }));
    setShowOriginSuggestions(false);
    setOriginSuggestions([]);
    if (originInputRef.current) {
      originInputRef.current.blur();
    }
  };

  const selectDestinationSuggestion = (location) => {
    const parts = location.split(',').map(s => s.trim());
    setFormData(prev => ({
      ...prev,
      destination: {
        ...prev.destination,
        address: location,
        city: parts[parts.length - 1] || parts[0] || ''
      }
    }));
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
    if (destinationInputRef.current) {
      destinationInputRef.current.blur();
    }
  };

  const handleLocationSelect = (type, locationData) => {
    const parts = locationData.address.split(',').map(s => s.trim());
    setFormData(prev => ({
      ...prev,
      [type]: {
        city: parts[parts.length - 1] || parts[0] || '',
        address: locationData.address,
        coordinates: locationData.coordinates
      }
    }));
    if (type === 'origin') {
      setShowOriginPicker(false);
      // Update the text input to show the selected address
      setFormData(prev => ({
        ...prev,
        origin: {
          ...prev.origin,
          address: locationData.address
        }
      }));
    } else {
      setShowDestinationPicker(false);
      // Update the text input to show the selected address
      setFormData(prev => ({
        ...prev,
        destination: {
          ...prev.destination,
          address: locationData.address
        }
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.origin.city || !formData.destination.city || !formData.departureDate ||
        !formData.capacity || !formData.price) {
      showError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const departureDate = new Date(formData.departureDate);
      if (formData.departureTime) {
        const time = new Date(formData.departureTime);
        departureDate.setHours(time.getHours());
        departureDate.setMinutes(time.getMinutes());
      }
      
      const tripData = {
        origin: {
          ...formData.origin,
          coordinates: formData.origin.coordinates
        },
        destination: {
          ...formData.destination,
          coordinates: formData.destination.coordinates
        },
        departureDate: departureDate.toISOString(),
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price)
      };

      showLoading('Creating trip...');
      await tripsService.create(tripData);
      hideLoading();
      showSuccess('Trip created successfully!');
      setTimeout(() => router.back(), 1000);
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Create Trip" />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origin</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={originInputRef}
              style={styles.textInput}
              placeholder="Enter origin location (e.g., Thamel, Kathmandu)"
              placeholderTextColor="#999"
              value={formData.origin.address}
              onChangeText={handleOriginInputChange}
              onFocus={() => {
                if (formData.origin.address) {
                  const suggestions = filterLocations(formData.origin.address);
                  setOriginSuggestions(suggestions);
                  setShowOriginSuggestions(suggestions.length > 0);
                }
              }}
              onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
            />
            <TouchableOpacity
              style={styles.mapIconButton}
              onPress={() => setShowOriginPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {originSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`origin-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => selectOriginSuggestion(item)}
                  >
                    <Ionicons name="location" size={16} color="#007AFF" />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={destinationInputRef}
              style={styles.textInput}
              placeholder="Enter destination location (e.g., Lakeside, Pokhara)"
              placeholderTextColor="#999"
              value={formData.destination.address}
              onChangeText={handleDestinationInputChange}
              onFocus={() => {
                if (formData.destination.address) {
                  const suggestions = filterLocations(formData.destination.address);
                  setDestinationSuggestions(suggestions);
                  setShowDestinationSuggestions(suggestions.length > 0);
                }
              }}
              onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
            />
            <TouchableOpacity
              style={styles.mapIconButton}
              onPress={() => setShowDestinationPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {destinationSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`destination-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => selectDestinationSuggestion(item)}
                  >
                    <Ionicons name="location" size={16} color="#007AFF" />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Departure</Text>
          <DatePicker
            value={formData.departureDate}
            onChange={(date) => setFormData(prev => ({ ...prev, departureDate: date }))}
            placeholder="Select departure date"
            mode="date"
            style={styles.dateInput}
          />
          <DatePicker
            value={formData.departureTime}
            onChange={(time) => setFormData(prev => ({ ...prev, departureTime: time }))}
            placeholder="Select departure time (optional)"
            mode="time"
            style={styles.dateInput}
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
            placeholder="Price per package (Rs)"
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

      {/* Map Location Pickers */}
      <MapLocationPicker
        visible={showOriginPicker}
        onClose={() => setShowOriginPicker(false)}
        onSelect={(locationData) => handleLocationSelect('origin', locationData)}
        initialLocation={formData.origin.coordinates.lat ? formData.origin.coordinates : null}
        title="Select Origin"
      />

      <MapLocationPicker
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={(locationData) => handleLocationSelect('destination', locationData)}
        initialLocation={formData.destination.coordinates.lat ? formData.destination.coordinates : null}
        title="Select Destination"
      />
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
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  placeholder: {
    color: '#999'
  },
  dateInput: {
    marginBottom: 10
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













