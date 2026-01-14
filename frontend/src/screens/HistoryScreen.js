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
import packagesService from '../services/packages';
import Header from '../components/Header';

const statusMeta = {
  delivered: { label: 'Delivered', color: '#0B63E6', bg: '#E6F0FF' },
  cancelled: { label: 'Cancelled', color: '#E53935', bg: '#FCE8E6' },
  expired: { label: 'Expired', color: '#F44336', bg: '#FFEBEE' },
  picked_up: { label: 'Picked Up', color: '#0B63E6', bg: '#E6F0FF' },
  in_transit: { label: 'In Transit', color: '#0B63E6', bg: '#E6F0FF' },
  accepted: { label: 'Accepted', color: '#0B63E6', bg: '#E6F0FF' },
  pending: { label: 'Pending', color: '#9CA3AF', bg: '#F3F4F6' }
};

const HistoryScreen = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await packagesService.historyMine();
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load history', error);
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
    const meta = statusMeta[status] || statusMeta.pending;
    return (
      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    );
  };

  const renderIcon = (status) => {
    if (status === 'cancelled') return <Ionicons name="close-circle-outline" size={18} color="#E53935" />;
    if (status === 'expired') return <Ionicons name="time-outline" size={18} color="#F44336" />;
    if (status === 'delivered') return <Ionicons name="checkmark-done-circle-outline" size={18} color="#0B63E6" />;
    if (status === 'picked_up' || status === 'in_transit' || status === 'accepted') {
      return <Ionicons name="cube-outline" size={18} color="#0B63E6" />;
    }
    return <Ionicons name="cube-outline" size={18} color="#9CA3AF" />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="History" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B63E6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="History" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      {items.map((pkg) => (
        <TouchableOpacity
          key={pkg._id}
          style={styles.card}
          onPress={() => router.push(`/package-detail/${pkg._id}`)}
        >
          <View style={styles.topRow}>
            <View style={[
              styles.iconWrapper,
              pkg.status === 'expired' && styles.iconWrapperExpired
            ]}>
              {renderIcon(pkg.status)}
            </View>
            <View style={styles.titleWrap}>
              <Text style={[
                styles.title,
                pkg.status === 'expired' && styles.titleExpired
              ]}>{pkg.description || 'Package'}</Text>
              <Text style={styles.date}>{formatDate(pkg.createdAt)}</Text>
            </View>
            {renderStatusBadge(pkg.status)}
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.label}>Route:</Text>
            <Text style={styles.value}>
              {pkg.origin?.city} → {pkg.destination?.city}
            </Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>Rs {pkg.fee}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {items.length === 0 && (
        <Text style={styles.empty}>No history yet.</Text>
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
  iconWrapperExpired: {
    backgroundColor: '#FFEBEE'
  },
  titleExpired: {
    color: '#F44336'
  },
  icon: {
    fontSize: 18
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

export default HistoryScreen;


