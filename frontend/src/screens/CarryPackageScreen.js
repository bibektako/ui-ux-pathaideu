import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import packagesService from '../services/packages';

const CarryPackageScreen = () => {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPackages = async (searchText = destination) => {
    try {
      setLoading(true);
      const data = await packagesService.searchAvailable(searchText.trim());
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages('');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPackages();
    setRefreshing(false);
  };

  const handleSearchChange = (text) => {
    setDestination(text);
    loadPackages(text);
  };

  const renderSizeLabel = (pkg) => {
    // Placeholder size label; adjust if you later add explicit size field
    return 'Small';
  };

  const handleAccept = (pkg) => {
    // For now, just navigate to the package status page
    router.push(`/package-detail/${pkg._id}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Your Destination Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Destination</Text>
        <Text style={styles.cardSubtitle}>Where are you traveling to?</Text>
        <Text style={styles.fieldLabel}>Destination</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="location-outline" size={18} color="#9AA5B1" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your destination"
            placeholderTextColor="#B0B0B0"
            value={destination}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>

      {/* Available Requests */}
      <Text style={styles.sectionTitle}>Available Requests</Text>

      {packages.map((pkg) => (
        <View key={pkg._id} style={styles.requestCard}>
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
              style={styles.acceptButton}
              onPress={() => handleAccept(pkg)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton}>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {!loading && packages.length === 0 && (
        <Text style={styles.emptyText}>No requests available for this destination.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: '#F9FAFF',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#9AA5B1'
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827'
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
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#9AA5B1'
  }
});

export default CarryPackageScreen;


