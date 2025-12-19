import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import packagesService from '../services/packages';
import useAuthStore from '../state/useAuthStore';

const PackageListScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
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

  const renderPackage = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/package-detail/${item._id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.code}>{item.code}</Text>
        <Text style={styles.fee}>${item.fee}</Text>
      </View>
      <Text style={styles.route}>
        {item.origin.city} → {item.destination.city}
      </Text>
      <Text style={styles.receiver}>To: {item.receiverName}</Text>
      <Text style={styles.payer}>Payer: {item.payer}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={packages}
        renderItem={renderPackage}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    marginBottom: 10
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  fee: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF'
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













