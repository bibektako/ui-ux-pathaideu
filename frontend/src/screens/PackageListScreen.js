import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import packagesService from '../services/packages';
import useAuthStore from '../state/useAuthStore';
import { useToast } from '../context/ToastContext';

const PackageListScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showError, showSuccess } = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const pkgs = await packagesService.list({ status: 'pending' });
      setPackages(pkgs);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPackages();
    setRefreshing(false);
  };

  const handleEdit = (pkg) => {
    // Navigate to create package screen with pre-filled data
    router.push({
      pathname: '/create-package',
      params: {
        edit: 'true',
        packageId: pkg._id,
        itemName: pkg.description || '',
        quantity: '1', // Default quantity
        receiverName: pkg.receiverName || '',
        receiverPhone: pkg.receiverPhone || '',
        pickupCity: pkg.origin?.city || '',
        pickupAddress: pkg.origin?.address || '',
        pickupLat: pkg.origin?.coordinates?.lat?.toString() || '',
        pickupLng: pkg.origin?.coordinates?.lng?.toString() || '',
        dropoffCity: pkg.destination?.city || '',
        dropoffAddress: pkg.destination?.address || '',
        dropoffLat: pkg.destination?.coordinates?.lat?.toString() || '',
        dropoffLng: pkg.destination?.coordinates?.lng?.toString() || '',
        fee: pkg.fee?.toString() || '',
        payer: pkg.payer || 'sender',
        photos: pkg.photos?.join(',') || ''
      }
    });
  };

  const handleDelete = (pkg) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to delete package ${pkg.code}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await packagesService.delete(pkg._id);
              showSuccess('Package deleted successfully');
              // Reload packages
              await loadPackages();
            } catch (error) {
              const errorMessage = error.response?.data?.error || error.message || 'Failed to delete package';
              showError(errorMessage);
            }
          }
        }
      ]
    );
  };

  const isPackageOwner = (pkg) => {
    const senderId = pkg.senderId?._id || pkg.senderId;
    return senderId?.toString() === user?.id?.toString();
  };

  const renderPackage = ({ item }) => {
    const isOwner = isPackageOwner(item);
    const canEditDelete = isOwner && ['pending', 'expired'].includes(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/package-detail/${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.code}>{item.code}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.fee}>Rs {item.fee}</Text>
            {canEditDelete && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.route}>
          {item.origin.city} → {item.destination.city}
        </Text>
        <Text style={styles.receiver}>To: {item.receiverName}</Text>
        <Text style={styles.payer}>Payer: {item.payer}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.headerTitle}>All Packages</Text>
      </View>

      <FlatList
        data={packages}
        renderItem={renderPackage}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No packages available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: Platform.OS === 'ios' ? 0 : 10
  },
  listContent: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  fee: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF'
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2'
  },
  route: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5
  },
  receiver: {
    fontSize: 14,
    color: '#999'
  },
  payer: {
    fontSize: 12,
    color: '#999',
    marginTop: 5
  },
  empty: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#999',
    fontSize: 16
  }
});

export default PackageListScreen;













