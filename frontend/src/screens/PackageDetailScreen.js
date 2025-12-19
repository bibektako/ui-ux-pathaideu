import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import packagesService from '../services/packages';
import useAuthStore from '../state/useAuthStore';

const PackageDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPackage();
  }, [id]);

  const loadPackage = async () => {
    try {
      const pkg = await packagesService.getById(id);
      setPackageData(pkg);
    } catch (error) {
      Alert.alert('Error', 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    Alert.prompt(
      'Accept Package',
      'Enter Trip ID:',
      async (tripId) => {
        if (!tripId) return;
        setActionLoading(true);
        try {
          await packagesService.accept(id, tripId);
          Alert.alert('Success', 'Package accepted!');
          loadPackage();
        } catch (error) {
          Alert.alert('Error', error.response?.data?.error || error.message);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handlePickup = async () => {
    setActionLoading(true);
    try {
      await packagesService.pickup(id);
      Alert.alert('Success', 'Package marked as picked up!');
      loadPackage();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    Alert.prompt(
      'Deliver Package',
      'Enter OTP (if required):',
      async (otp) => {
        setActionLoading(true);
        try {
          await packagesService.deliver(id, otp || null);
          Alert.alert('Success', 'Package delivered!');
          loadPackage();
        } catch (error) {
          Alert.alert('Error', error.response?.data?.error || error.message);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!packageData) {
    return (
      <View style={styles.container}>
        <Text>Package not found</Text>
      </View>
    );
  }

  // Any user can accept packages (as traveller)
  const canAccept = packageData.status === 'pending' && !packageData.travellerId;
  // User can pickup if they accepted the package
  const canPickup = packageData.travellerId?._id === user?.id && 
                    packageData.status === 'accepted';
  // User can deliver if they picked up the package
  const canDeliver = packageData.travellerId?._id === user?.id && 
                     ['picked_up', 'in_transit'].includes(packageData.status);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.code}>{packageData.code}</Text>
        <Text style={styles.status}>Status: {packageData.status}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <Text style={styles.text}>
            From: {packageData.origin.city}, {packageData.origin.address}
          </Text>
          <Text style={styles.text}>
            To: {packageData.destination.city}, {packageData.destination.address}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receiver</Text>
          <Text style={styles.text}>Name: {packageData.receiverName}</Text>
          <Text style={styles.text}>Phone: {packageData.receiverPhone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.text}>Fee: ${packageData.fee}</Text>
          <Text style={styles.text}>Payer: {packageData.payer}</Text>
          <Text style={styles.text}>Payment Status: {packageData.paymentStatus}</Text>
        </View>

        {packageData.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.text}>{packageData.description}</Text>
          </View>
        )}

        {canAccept && (
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Accept Package</Text>
            )}
          </TouchableOpacity>
        )}

        {canPickup && (
          <TouchableOpacity
            style={[styles.button, styles.pickupButton]}
            onPress={handlePickup}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mark as Picked Up</Text>
            )}
          </TouchableOpacity>
        )}

        {canDeliver && (
          <TouchableOpacity
            style={[styles.button, styles.deliverButton]}
            onPress={handleDeliver}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mark as Delivered</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.trackButton]}
          onPress={() => router.push(`/tracking/${id}`)}
        >
          <Text style={styles.buttonText}>View Tracking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  status: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 20
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  acceptButton: {
    backgroundColor: '#4CAF50'
  },
  pickupButton: {
    backgroundColor: '#FF9800'
  },
  deliverButton: {
    backgroundColor: '#2196F3'
  },
  trackButton: {
    backgroundColor: '#9C27B0'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PackageDetailScreen;

