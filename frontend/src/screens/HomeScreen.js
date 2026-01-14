import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../state/useAuthStore';
import packagesService from '../services/packages';
import tripsService from '../services/trips';
import adsService from '../services/ads';
import AdCarousel from '../components/AdCarousel';
import { getImageUri } from '../utils/imageUtils';

const HomeScreen = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [packages, setPackages] = useState([]);
  const [trips, setTrips] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [ads, setAds] = useState([]);

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

      // Load active ads
      const activeAds = await adsService.getActiveAds();
      setAds(activeAds);

      // Create recent activity from packages and trips
      const activity = [];
      pkgs.forEach(pkg => {
        let title = 'New delivery request';
        if (pkg.status === 'delivered') {
          title = 'Package delivered';
        } else if (pkg.status === 'expired') {
          title = 'Package expired';
        }
        activity.push({
          id: pkg._id,
          type: 'package',
          title,
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

  const getProfileImageSource = () => {
    if (user?.profileImage) {
      return { uri: getImageUri(user.profileImage) };
    }
    return { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User') + '&background=0047AB&color=fff' };
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
              source={getProfileImageSource()}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || 'User'}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.searchContainer}
          activeOpacity={0.8}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>search...</Text>
        </TouchableOpacity>
      </View>

      {/* Ads Section */}
      <View style={styles.adsSection}>
        {ads.length > 0 ? (
          <AdCarousel ads={ads} style={styles.adCarousel} />
        ) : (
          <View style={styles.adCardSingle}>
            <Text style={styles.adPlaceholder}>Ad Space</Text>
          </View>
        )}
      </View>

      <View style={styles.offersContainer}>
        <TouchableOpacity style={styles.offersButton}>
          <Text style={styles.offersButtonText}>Offers</Text>
        </TouchableOpacity>
      </View>

      {/* Service Cards */}
      <View style={styles.servicesSection}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => router.push('/create-package')}
        >
          <View style={styles.serviceIcon}>
            <Ionicons name="cube-outline" size={24} color="#007AFF" />
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle}>Send a Package</Text>
            <Text style={styles.serviceDescription}>Request someone to deliver your package</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/create-package')}>
            <Text style={styles.serviceButton}>Start →</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => router.push('/carry-package')}
        >
          <View style={styles.serviceIcon}>
            <Ionicons name="briefcase-outline" size={24} color="#007AFF" />
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle}>Carry a Package</Text>
            <Text style={styles.serviceDescription}>Earn money by delivering packages on your route</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/carry-package')}>
            <Text style={styles.serviceButton}>View →</Text>
          </TouchableOpacity>
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
                  activity.status === 'delivered' ? styles.activityDotActive : 
                  activity.status === 'expired' ? styles.activityDotExpired : 
                  styles.activityDotInactive
                ]} />
                <View style={styles.activityTextContainer}>
                  <Text style={[
                    styles.activityTitle,
                    activity.status === 'expired' && styles.activityTitleExpired
                  ]}>{activity.title}</Text>
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
    paddingBottom: 20
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
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#999'
  },
  adsSection: {
    padding: 15,
    paddingBottom: 15
  },
  adCarousel: {
    marginBottom: 0
  },
  adCardSingle: {
    width: '100%',
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
  offersContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  offersButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  offersButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500'
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
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
  serviceButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500'
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
  activityDotExpired: {
    backgroundColor: '#F44336'
  },
  activityDotInactive: {
    backgroundColor: '#ccc'
  },
  activityTitleExpired: {
    color: '#F44336'
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
