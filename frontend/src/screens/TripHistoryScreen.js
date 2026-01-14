import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tripsService from '../services/trips';
import Header from '../components/Header';

const statusMeta = {
  completed: { label: 'Completed', color: '#0B63E6', bg: '#E6F0FF' },
  cancelled: { label: 'Cancelled', color: '#E53935', bg: '#FCE8E6' },
  active: { label: 'Active', color: '#0B63E6', bg: '#E6F0FF' }
};

const TripHistoryScreen = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await tripsService.historyMine();
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load trip history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStatusBadge = (status) => {
    const meta = statusMeta[status] || statusMeta.active;
    return (
      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    );
  };

  const renderIcon = (status) => {
    if (status === 'cancelled') return <Ionicons name="close-circle-outline" size={18} color="#E53935" />;
    if (status === 'completed') return <Ionicons name="checkmark-done-circle-outline" size={18} color="#0B63E6" />;
    return <Ionicons name="car-outline" size={18} color="#0B63E6" />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Trip" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B63E6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Trip" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      {items.map((trip) => (
        <TouchableOpacity
          key={trip._id}
          style={styles.card}
          onPress={() => {
            // Navigate to trip details if needed
            console.log('Trip details:', trip._id);
          }}
        >
          <View style={styles.topRow}>
            <View style={styles.iconWrapper}>
              {renderIcon(trip.status)}
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>
                {trip.origin?.city} → {trip.destination?.city}
              </Text>
              <Text style={styles.date}>{formatDate(trip.departureDate)}</Text>
            </View>
            {renderStatusBadge(trip.status)}
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.label}>Route:</Text>
            <Text style={styles.value}>
              {trip.origin?.address} → {trip.destination?.address}
            </Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.label}>Price:</Text>
            <Text style={styles.value}>Rs {trip.price}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.label}>Packages:</Text>
            <Text style={styles.value}>
              {trip.acceptedPackages?.length || 0} / {trip.capacity}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {items.length === 0 && (
        <Text style={styles.empty}>No trip history yet.</Text>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 12,
    paddingBottom: 24
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FB'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  titleWrap: {
    flex: 1
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  date: {
    fontSize: 12,
    color: '#6B7280'
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  label: {
    fontSize: 12,
    color: '#6B7280'
  },
  value: {
    fontSize: 12,
    color: '#111827'
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
    fontSize: 13
  }
});

export default TripHistoryScreen;

