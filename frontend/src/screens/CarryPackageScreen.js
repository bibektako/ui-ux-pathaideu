import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import packagesService from '../services/packages';
import tripsService from '../services/trips';
import useAuthStore from '../state/useAuthStore';
import { useToast, useLoading } from '../context/ToastContext';
import Header from '../components/Header';
import MapLocationPicker from '../components/MapLocationPicker';

// Nepal locations list
const NEPAL_LOCATIONS = [
  // Major Cities
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Birgunj', 
  'Butwal', 'Dharan', 'Hetauda', 'Janakpur', 'Nepalgunj', 'Itahari', 'Dhulikhel',
  'Bharatpur', 'Bhimdatta', 'Tulsipur', 'Ghorahi', 'Siddharthanagar', 'Birendranagar','Jhapa',
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

const CarryPackageScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [destination, setDestination] = useState('');
  const [packages, setPackages] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingPackageId, setAcceptingPackageId] = useState(null);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [destinationCoordinates, setDestinationCoordinates] = useState({ lat: 0, lng: 0 });
  const [showTrips, setShowTrips] = useState(false);
  const destinationInputRef = useRef(null);
  const { showError, showSuccess, showWarning } = useToast();
  const { showLoading, hideLoading } = useLoading();

  const filterLocations = (query) => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return NEPAL_LOCATIONS.filter(location => 
      location.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  };

  const loadPackages = async (searchText = destination) => {
    try {
      setLoading(true);
      const data = await packagesService.searchAvailable(searchText.trim());
      // Filter out packages created by the current user
      const filteredData = data.filter(pkg => {
        const senderId = pkg.senderId?._id || pkg.senderId;
        return senderId?.toString() !== user?.id?.toString();
      });
      setPackages(filteredData);
    } catch (error) {
      console.error('Failed to load packages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages('');
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await tripsService.list({ travellerId: user?.id });
      setTrips(data || []);
    } catch (error) {
      console.error('Failed to load trips', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPackages(), loadTrips()]);
    setRefreshing(false);
  };

  const handleSearchChange = (text) => {
    setDestination(text);
    const suggestions = filterLocations(text);
    setDestinationSuggestions(suggestions);
    setShowDestinationSuggestions(suggestions.length > 0 && text.length > 0);
    loadPackages(text);
  };

  const selectDestinationSuggestion = (location) => {
    setDestination(location);
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
    loadPackages(location);
    if (destinationInputRef.current) {
      destinationInputRef.current.blur();
    }
  };

  const handleDestinationSelect = (locationData) => {
    setDestination(locationData.address);
    setDestinationCoordinates(locationData.coordinates);
    setShowDestinationPicker(false);
    loadPackages(locationData.address);
  };

  const renderSizeLabel = (pkg) => {
    // Placeholder size label; adjust if you later add explicit size field
    return 'Small';
  };

  const handleAccept = async (pkg) => {
    // Additional frontend check: prevent accepting own packages
    const senderId = pkg.senderId?._id || pkg.senderId;
    if (senderId?.toString() === user?.id?.toString()) {
      showError('You cannot accept your own package');
      return;
    }

    try {
      // Check if user has active trips
      const trips = await tripsService.list({ travellerId: user?.id });
      const activeTrips = trips.filter(trip => trip.status === 'active');

      let tripId = null;

      if (activeTrips.length === 0) {
        // Keep Alert for this one as it needs user decision (Hick's Law - reduce choices)
        Alert.alert(
          'No Active Trip',
          'You need to create a trip first before accepting packages. Would you like to create one?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Create Trip', 
              onPress: () => router.push('/create-trip')
            }
          ]
        );
        return;
      } else if (activeTrips.length === 1) {
        // Auto-use the only active trip
        tripId = activeTrips[0]._id;
      } else {
        // Multiple trips - prompt user to select
        const tripOptions = activeTrips.map(trip => 
          `${trip.origin.city} → ${trip.destination.city}`
        );
        
        Alert.alert(
          'Select Trip',
          'Which trip would you like to use?',
          [
            ...activeTrips.map((trip, index) => ({
              text: `${trip.origin.city} → ${trip.destination.city}`,
              onPress: () => acceptPackage(pkg._id, trip._id)
            })),
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Accept with the selected trip
      await acceptPackage(pkg._id, tripId);
    } catch (error) {
      console.error('Error checking trips:', error);
      showError('Failed to check your trips. Please try again.');
    }
  };

  const acceptPackage = async (packageId, tripId) => {
    setAcceptingPackageId(packageId);
    showLoading('Accepting package...');
    try {
      await packagesService.accept(packageId, tripId);
      // Refresh the list to remove accepted package
      showLoading('Refreshing packages...');
      await loadPackages();
      hideLoading();
      showSuccess('Package accepted successfully!');
      // Peak-End Rule: Positive ending experience
      setTimeout(() => {
        router.push(`/package-detail/${packageId}`);
      }, 800);
    } catch (error) {
      hideLoading();
      const errorMessage = error.response?.data?.error || error.message || 'Failed to accept package';
      showError(errorMessage);
    } finally {
      setAcceptingPackageId(null);
    }
  };

  const handleReject = (pkg) => {
    // Since there's no reject API, we'll just show a message
    // The package will remain in the list for other users
    showWarning('Package skipped. You can view it later if you change your mind.');
  };

  const handleCardPress = (pkg) => {
    // Navigate to package details when card is clicked
    router.push(`/package-detail/${pkg._id}`);
  };

  return (
    <View style={styles.container}>
      <Header title="Carry Package" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* My Trips Section */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>My Trips</Text>
            <Text style={styles.cardSubtitle}>View and manage your trips</Text>
          </View>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowTrips(!showTrips)}
          >
            <Ionicons 
              name={showTrips ? "chevron-up-outline" : "chevron-down-outline"} 
              size={20} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>
        
        {showTrips && (
          <View style={styles.tripsList}>
            {trips.length === 0 ? (
              <View style={styles.emptyTripsContainer}>
                <Ionicons name="car-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTripsText}>No trips yet</Text>
                <TouchableOpacity
                  style={styles.createTripButton}
                  onPress={() => router.push('/create-trip')}
                >
                  <Text style={styles.createTripButtonText}>Create Trip</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {trips.map((trip) => (
                  <TouchableOpacity
                    key={trip._id}
                    style={[
                      styles.tripItem,
                      trip.status === 'active' && styles.tripItemActive,
                      trip.status === 'completed' && styles.tripItemCompleted,
                      trip.status === 'cancelled' && styles.tripItemCancelled
                    ]}
                    onPress={() => {
                      // Navigate to trip details or create trip screen
                      console.log('Trip:', trip._id);
                    }}
                  >
                    <View style={styles.tripItemHeader}>
                      <View style={styles.tripItemLeft}>
                        <Ionicons 
                          name={trip.status === 'completed' ? "checkmark-circle" : trip.status === 'cancelled' ? "close-circle" : "car"} 
                          size={18} 
                          color={
                            trip.status === 'completed' ? "#0B63E6" : 
                            trip.status === 'cancelled' ? "#E53935" : 
                            "#007AFF"
                          } 
                        />
                        <View style={styles.tripItemText}>
                          <Text style={styles.tripItemTitle}>
                            {trip.origin?.city} → {trip.destination?.city}
                          </Text>
                          <Text style={styles.tripItemSubtitle}>
                            {new Date(trip.departureDate).toLocaleDateString()} • Rs {trip.price}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.tripStatusBadge,
                        trip.status === 'active' && styles.tripStatusBadgeActive,
                        trip.status === 'completed' && styles.tripStatusBadgeCompleted,
                        trip.status === 'cancelled' && styles.tripStatusBadgeCancelled
                      ]}>
                        <Text style={[
                          styles.tripStatusText,
                          trip.status === 'active' && styles.tripStatusTextActive,
                          trip.status === 'completed' && styles.tripStatusTextCompleted,
                          trip.status === 'cancelled' && styles.tripStatusTextCancelled
                        ]}>
                          {trip.status === 'active' ? 'Active' : trip.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tripItemFooter}>
                      <Text style={styles.tripItemFooterText}>
                        Packages: {trip.acceptedPackages?.length || 0} / {trip.capacity}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.createTripButtonInline}
                  onPress={() => router.push('/create-trip')}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                  <Text style={styles.createTripButtonInlineText}>Create New Trip</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Your Destination Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Destination</Text>
        <Text style={styles.cardSubtitle}>Where are you traveling to?</Text>
        <Text style={styles.fieldLabel}>Destination</Text>
        <View style={styles.inputWrapperContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={destinationInputRef}
              style={styles.input}
              placeholder="Enter your destination (e.g., Lakeside, Pokhara)"
              placeholderTextColor="#B0B0B0"
              value={destination}
              onChangeText={handleSearchChange}
              onFocus={() => {
                if (destination) {
                  const suggestions = filterLocations(destination);
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
              <Ionicons name="map-outline" size={18} color="#9AA5B1" />
            </TouchableOpacity>
          </View>
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

      {/* Available Requests */}
      <Text style={styles.sectionTitle}>Available Requests</Text>

      {packages.map((pkg) => (
        <TouchableOpacity
          key={pkg._id}
          style={styles.requestCard}
          onPress={() => handleCardPress(pkg)}
          activeOpacity={0.7}
        >
          <View style={styles.requestHeader}>
            <View style={styles.requestLeft}>
              <View style={styles.iconCircle}>
                  <Ionicons name="cube-outline" size={18} color="#1D4ED8" />
              </View>
              <View>
                <Text style={styles.requestTitle}>
                  {pkg.description || 'Package'}
                </Text>
                <Text style={styles.requestSubtitle}>{renderSizeLabel(pkg)}</Text>
              </View>
            </View>
            <Text style={styles.priceText}>Rs {pkg.fee}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color="#9AA5B1" style={styles.rowIcon} />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>From:</Text>
              <Text style={styles.rowValue}>
                {pkg.origin?.city}, {pkg.origin?.address}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color="#9AA5B1" style={styles.rowIcon} />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>To:</Text>
              <Text style={styles.rowValue}>
                {pkg.destination?.city}, {pkg.destination?.address}
              </Text>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                acceptingPackageId === pkg._id && styles.buttonDisabled
              ]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent card navigation
                handleAccept(pkg);
              }}
              disabled={acceptingPackageId === pkg._id}
            >
              {acceptingPackageId === pkg._id ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent card navigation
                handleReject(pkg);
              }}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      {!loading && packages.length === 0 && (
        <Text style={styles.emptyText}>No requests available for this destination.</Text>
      )}
      </ScrollView>

      {/* Map Location Picker */}
      <MapLocationPicker
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={handleDestinationSelect}
        initialLocation={destinationCoordinates.lat ? destinationCoordinates : null}
        title="Select Destination"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2933',
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6C7A89',
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 13,
    color: '#3C4858',
    marginBottom: 6
  },
  inputWrapperContainer: {
    position: 'relative'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: '#F9FAFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative'
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#9AA5B1'
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingRight: 30
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2933',
    marginBottom: 12
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  iconText: {
    fontSize: 18
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  requestSubtitle: {
    fontSize: 12,
    color: '#9AA5B1'
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  rowIcon: {
    width: 20,
    marginTop: 2,
    fontSize: 12
  },
  rowTextContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C7A89',
    marginRight: 4
  },
  rowValue: {
    fontSize: 12,
    color: '#111827',
    flexShrink: 1
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 12
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#0052CC',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#9AA5B1'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  toggleButton: {
    padding: 4
  },
  tripsList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12
  },
  tripItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  tripItemActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF'
  },
  tripItemCompleted: {
    borderColor: '#0B63E6',
    backgroundColor: '#E6F0FF'
  },
  tripItemCancelled: {
    borderColor: '#E53935',
    backgroundColor: '#FCE8E6'
  },
  tripItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  tripItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  tripItemText: {
    marginLeft: 10,
    flex: 1
  },
  tripItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  tripItemSubtitle: {
    fontSize: 12,
    color: '#6B7280'
  },
  tripStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  tripStatusBadgeActive: {
    backgroundColor: '#E6F0FF'
  },
  tripStatusBadgeCompleted: {
    backgroundColor: '#E6F0FF'
  },
  tripStatusBadgeCancelled: {
    backgroundColor: '#FCE8E6'
  },
  tripStatusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  tripStatusTextActive: {
    color: '#007AFF'
  },
  tripStatusTextCompleted: {
    color: '#0B63E6'
  },
  tripStatusTextCancelled: {
    color: '#E53935'
  },
  tripItemFooter: {
    marginTop: 4
  },
  tripItemFooterText: {
    fontSize: 12,
    color: '#6B7280'
  },
  emptyTripsContainer: {
    alignItems: 'center',
    paddingVertical: 24
  },
  emptyTripsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 12
  },
  createTripButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  createTripButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  createTripButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#E6F0FF'
  },
  createTripButtonInlineText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6
  }
});

export default CarryPackageScreen;


