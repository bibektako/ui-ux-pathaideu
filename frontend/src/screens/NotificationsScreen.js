import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import notificationsService from '../services/notifications';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const badgeColor = (type) => {
  switch (type) {
    case 'offer':
      return { bg: '#E6F0FF', fg: '#1D4ED8' };
    case 'package_accepted':
    case 'package_created':
      return { bg: '#E8F5E9', fg: '#2E7D32' };
    case 'profile_update':
    case 'id_submitted':
      return { bg: '#FFF4E5', fg: '#F59E0B' };
    default:
      return { bg: '#F3F4F6', fg: '#4B5563' };
  }
};

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await notificationsService.list();
      setItems(data || []);
      console.log('📬 Loaded notifications:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      load(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  const renderIcon = (type) => {
    if (type === 'offer') return <Ionicons name="gift-outline" size={22} color="#4B5563" />;
    if (type === 'package_accepted') return <Ionicons name="checkmark-done-outline" size={22} color="#4B5563" />;
    if (type === 'package_created') return <Ionicons name="cube-outline" size={22} color="#4B5563" />;
    if (type === 'profile_update') return <Ionicons name="person-circle-outline" size={22} color="#4B5563" />;
    if (type === 'id_submitted') return <Ionicons name="shield-checkmark-outline" size={22} color="#4B5563" />;
    return <Ionicons name="notifications-outline" size={22} color="#4B5563" />;
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
      }
    >
      <View style={styles.headerRow}>
        <Ionicons name="notifications-outline" size={22} color="#111827" />
        <Text style={styles.headerText}>Notification</Text>
      </View>

      {items.map((n) => {
        const colors = badgeColor(n.type);
        return (
          <View key={n._id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconCircle}>{renderIcon(n.type)}</View>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{n.title}</Text>
                <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.badgeText, { color: colors.fg }]}>{n.type.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.message}>{n.message}</Text>
              <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
            </View>
          </View>
        );
      })}

      {items.length === 0 && <Text style={styles.empty}>No notifications yet.</Text>}

      <TouchableOpacity style={styles.readAll} onPress={async () => {
        await notificationsService.markAllRead();
        load();
      }}>
        <Text style={styles.readAllText}>Mark all as read</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  headerText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  card: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  cardLeft: {
    width: 48,
    alignItems: 'center',
    paddingTop: 4
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardBody: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  message: {
    marginTop: 4,
    fontSize: 13,
    color: '#4B5563'
  },
  time: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280'
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 24
  },
  readAll: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  readAllText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 13
  }
});

export default NotificationsScreen;





