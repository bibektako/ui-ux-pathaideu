import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../state/useAuthStore';
import packagesService from '../services/packages';
import tripsService from '../services/trips';

const HomeScreen = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [packages, setPackages] = useState([]);
  const [trips, setTrips] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load both packages and trips for all users
      const pkgs = await packagesService.list({ senderId: user.id });
      setPackages(pkgs);
      
      const travellerTrips = await tripsService.list({ travellerId: user.id });
      setTrips(travellerTrips);

      // Create recent activity from packages and trips
      const activity = [];
      pkgs.forEach(pkg => {
        activity.push({
          id: pkg._id,
          type: 'package',
          title: pkg.status === 'delivered' ? 'Package delivered' : 'New delivery request',
          time: pkg.createdAt || pkg.deliveredAt,
          status: pkg.status
        });
      });
      activity.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activity.slice(0, 5));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Section - Profile and Search */}
      <View style={styles.topSection}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User') + '&background=007AFF&color=fff' }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || 'User'}</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="search..."
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Ads/Coupons Section */}
      <View style={styles.adsSection}>
        <View style={styles.adCardLarge}>
          <Text style={styles.adPlaceholder}>Ad Space</Text>
        </View>
        <View style={styles.adCardSmall}>
          <Text style={styles.adPlaceholder}>Coupon</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.offersButton}>
        <Text style={styles.offersButtonText}>Offers</Text>
      </TouchableOpacity>

      {/* Service Cards */}
      <View style={styles.servicesSection}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => router.push('/create-package')}
        >
          <View style={styles.serviceIcon}>
            <Text style={styles.serviceIconText}>📦</Text>
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle}>Send a Package</Text>
            <Text style={styles.serviceDescription}>Request someone to deliver your package</Text>
          </View>
          <Text style={styles.serviceLink}>Start →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => router.push('/create-trip')}
        >
          <View style={styles.serviceIcon}>
            <Text style={styles.serviceIconText}>📈</Text>
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle}>Carry a Package</Text>
            <Text style={styles.serviceDescription}>Earn money by delivering packages on your route</Text>
          </View>
          <Text style={styles.serviceLink}>View →</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          recentActivity.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => {
                if (activity.type === 'package') {
                  router.push(`/package-detail/${activity.id}`);
                }
              }}
            >
              <View style={styles.activityLeft}>
                <View style={[
                  styles.activityDot,
                  activity.status === 'delivered' ? styles.activityDotActive : styles.activityDotInactive
                ]} />
                <View style={styles.activityTextContainer}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{getTimeAgo(activity.time)}</Text>
                </View>
              </View>
              <Text style={styles.activityView}>View</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  topSection: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  profileImageContainer: {
    marginRight: 12
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF'
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#999'
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  adsSection: {
    flexDirection: 'row',
    padding: 15,
    gap: 10
  },
  adCardLarge: {
    flex: 2,
    height: 120,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  adCardSmall: {
    flex: 1,
    height: 120,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  adPlaceholder: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  offersButton: {
    backgroundColor: '#4A90E2',
    marginHorizontal: 15,
    marginBottom: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  offersButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  servicesSection: {
    paddingHorizontal: 15,
    marginBottom: 20
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  serviceIconText: {
    fontSize: 24
  },
  serviceContent: {
    flex: 1
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666'
  },
  serviceLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600'
  },
  activitySection: {
    padding: 15,
    paddingTop: 0
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12
  },
  activityDotActive: {
    backgroundColor: '#007AFF'
  },
  activityDotInactive: {
    backgroundColor: '#ccc'
  },
  activityTextContainer: {
    flex: 1
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  activityTime: {
    fontSize: 12,
    color: '#999'
  },
  activityView: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500'
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20
  }
});

export default HomeScreen;
