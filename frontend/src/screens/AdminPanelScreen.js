import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import createAPI from '../services/api';
import useAuthStore from '../state/useAuthStore';
import adsService from '../services/ads';
import authService from '../services/auth';
import { useToast } from '../context/ToastContext';
import { getImageUri } from '../utils/imageUtils';

const AdminPanelScreen = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const { showSuccess } = useToast();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' or 'ads'
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adLink, setAdLink] = useState('');
  const [selectedAdFile, setSelectedAdFile] = useState(null);
  const [uploadingAd, setUploadingAd] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              showSuccess('Logged out successfully');
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingVerifications();
      loadAds();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'ads') {
      loadAds();
    }
  }, [activeTab]);

  const loadPendingVerifications = async () => {
    try {
      const api = createAPI();
      const response = await api.get('/api/admin/pending-verifications');
      // Use submissions which include both user and submission data
      const submissions = response.data.submissions || [];
      setPendingVerifications(submissions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const getBaseURL = () => {
    // Get base URL from auth store backend IP
    const backendIP = useAuthStore.getState().backendIP;
    const baseURL = backendIP || 'http://localhost:3000';
    // Remove trailing slash if present
    return baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  };

  const handleVerify = async (userId, verified) => {
    try {
      const api = createAPI();
      await api.post(`/api/admin/verify-user/${userId}`, { verified });
      Alert.alert('Success', `User ${verified ? 'verified' : 'rejected'}`);
      loadPendingVerifications();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to verify user');
    }
  };

  const loadAds = async () => {
    try {
      const allAds = await adsService.getAllAds();
      setAds(allAds);
    } catch (error) {
      Alert.alert('Error', 'Failed to load ads');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'verifications') {
      await loadPendingVerifications();
    } else {
      await loadAds();
    }
    setRefreshing(false);
  };

  const handlePickAdFile = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 7, // Max 7 seconds for videos
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Check if video is within 7 seconds
      if (asset.type === 'video' && asset.duration && asset.duration > 7) {
        Alert.alert('Error', 'Video must be 7 seconds or less');
        return;
      }
      setSelectedAdFile(asset);
    }
  };

  const handleUploadAd = async () => {
    if (!selectedAdFile) {
      Alert.alert('Error', 'Please select a file');
      return;
    }

    setUploadingAd(true);
    try {
      await adsService.uploadAd(selectedAdFile, adTitle || 'Ad', adLink || null);
      Alert.alert('Success', 'Ad uploaded successfully');
      setShowAdModal(false);
      setSelectedAdFile(null);
      setAdTitle('');
      setAdLink('');
      loadAds();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload ad');
    } finally {
      setUploadingAd(false);
    }
  };

  const handleToggleAd = async (ad) => {
    try {
      await adsService.updateAd(ad._id, { active: !ad.active });
      loadAds();
    } catch (error) {
      Alert.alert('Error', 'Failed to update ad');
    }
  };

  const handleDeleteAd = async (ad) => {
    Alert.alert(
      'Delete Ad',
      'Are you sure you want to delete this ad?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adsService.deleteAd(ad._id);
              loadAds();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ad');
            }
          }
        }
      ]
    );
  };

  const renderVerification = ({ item }) => {
    const user = item.userId || item;
    const submission = item;
    const idNumber = submission.metadata?.idNumber || 'N/A';
    const idImage = submission.files?.[0];
    
    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.profileSection}>
            {user.profileImage ? (
              <Image
                source={{ uri: getImageUri(user.profileImage) }}
                style={styles.profileImage}
                onError={(error) => {
                  console.error('❌ Profile image error:', error.nativeEvent.error, user.profileImage);
                }}
                onLoad={() => {
                  console.log('✅ Profile image loaded:', user.profileImage);
                }}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profilePlaceholderText}>
                  {(user.name || 'U').substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.phone}>{user.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.verificationSection}>
          <Text style={styles.sectionLabel}>ID Number:</Text>
          <Text style={styles.idNumber}>{idNumber}</Text>
          
          <Text style={styles.sectionLabel}>Profile Picture:</Text>
          {user.profileImage ? (
            <Image
              source={{ uri: getImageUri(user.profileImage) }}
              style={styles.verificationImage}
              onError={(error) => {
                console.error('❌ Profile verification image error:', error.nativeEvent.error, user.profileImage);
              }}
              onLoad={() => {
                console.log('✅ Profile verification image loaded:', user.profileImage);
              }}
            />
          ) : (
            <Text style={styles.noImageText}>No profile picture</Text>
          )}

          <Text style={styles.sectionLabel}>ID Card Photo:</Text>
          {idImage ? (
            <Image
              source={{ uri: getImageUri(idImage) }}
              style={styles.verificationImage}
              onError={(error) => {
                console.error('❌ ID image error:', error.nativeEvent.error, idImage);
              }}
              onLoad={() => {
                console.log('✅ ID image loaded:', idImage);
              }}
            />
          ) : (
            <Text style={styles.noImageText}>No ID photo</Text>
          )}
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleVerify(user._id, true)}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleVerify(user._id, false)}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text>Admin access required</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderAd = ({ item }) => {
    const fileType = item.fileType || (item.file?.endsWith('.gif') ? 'gif' : item.file?.endsWith('.mp4') ? 'video' : 'image');
    
    return (
      <View style={styles.card}>
        <View style={styles.adHeader}>
          <Text style={styles.adTitle}>{item.title}</Text>
          <View style={styles.adBadge}>
            <Text style={[styles.adBadgeText, item.active && styles.adBadgeActive]}>
              {item.active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        {item.file && (
          <Image
            source={{ uri: getImageUri(item.file) }}
            style={styles.adPreview}
            resizeMode="cover"
            onError={(error) => {
              console.error('❌ Ad image error:', error.nativeEvent.error, item.file);
            }}
            onLoad={() => {
              console.log('✅ Ad image loaded:', item.file);
            }}
          />
        )}
        
        {item.link && (
          <Text style={styles.adLink} numberOfLines={1}>
            Link: {item.link}
          </Text>
        )}
        
        <View style={styles.adActions}>
          <TouchableOpacity
            style={[styles.adActionButton, item.active ? styles.deactivateButton : styles.activateButton]}
            onPress={() => handleToggleAd(item)}
          >
            <Text style={styles.adActionText}>
              {item.active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adActionButton, styles.deleteButton]}
            onPress={() => handleDeleteAd(item)}
          >
            <Text style={styles.adActionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header with Title and Logout Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#0047AB" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'verifications' && styles.tabActive]}
          onPress={() => setActiveTab('verifications')}
        >
          <Text style={[styles.tabText, activeTab === 'verifications' && styles.tabTextActive]}>
            Verifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ads' && styles.tabActive]}
          onPress={() => setActiveTab('ads')}
        >
          <Text style={[styles.tabText, activeTab === 'ads' && styles.tabTextActive]}>
            Ads
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'verifications' ? (
        <>
          <Text style={styles.subtitle}>Pending Verifications</Text>
          <FlatList
            data={pendingVerifications}
            renderItem={renderVerification}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No pending verifications</Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          <View style={styles.adsHeader}>
            <Text style={styles.subtitle}>Manage Ads</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAdModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Ad</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={ads}
            renderItem={renderAd}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No ads yet. Add your first ad!</Text>
              </View>
            }
          />
        </>
      )}

      {/* Add Ad Modal */}
      <Modal
        visible={showAdModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload New Ad</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Ad Title (optional)"
              value={adTitle}
              onChangeText={setAdTitle}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Link URL (optional)"
              value={adLink}
              onChangeText={setAdLink}
              keyboardType="url"
              autoCapitalize="none"
            />
            
            <TouchableOpacity
              style={styles.fileButton}
              onPress={handlePickAdFile}
            >
              <Text style={styles.fileButtonText}>
                {selectedAdFile ? 'File Selected ✓' : 'Select Image/GIF/Video (max 7s)'}
              </Text>
            </TouchableOpacity>
            
            {selectedAdFile && (
              <Text style={styles.fileInfo}>
                {selectedAdFile.type === 'video' 
                  ? `Video: ${selectedAdFile.duration?.toFixed(1)}s`
                  : `Image: ${selectedAdFile.fileName || 'Selected'}`}
              </Text>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAdModal(false);
                  setSelectedAdFile(null);
                  setAdTitle('');
                  setAdLink('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.uploadButton]}
                onPress={handleUploadAd}
                disabled={uploadingAd || !selectedAdFile}
              >
                {uploadingAd ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0047AB',
    backgroundColor: '#fff'
  },
  logoutButtonText: {
    color: '#0047AB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  userInfo: {
    marginBottom: 15
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#E0E0E0'
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  profilePlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  userDetails: {
    flex: 1
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333'
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3
  },
  verificationSection: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5
  },
  idNumber: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10
  },
  verificationImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover'
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 10
  },
  role: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  approveButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#F44336'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  empty: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#999',
    fontSize: 16
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 16,
    color: '#666'
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  adsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  adBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0'
  },
  adBadgeActive: {
    backgroundColor: '#4CAF50'
  },
  adBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  },
  adPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0'
  },
  adLink: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 10
  },
  adActions: {
    flexDirection: 'row',
    gap: 10
  },
  adActionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  activateButton: {
    backgroundColor: '#4CAF50'
  },
  deactivateButton: {
    backgroundColor: '#FF9800'
  },
  deleteButton: {
    backgroundColor: '#F44336'
  },
  adActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16
  },
  fileButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  fileInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#ddd'
  },
  uploadButton: {
    backgroundColor: '#007AFF'
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});

export default AdminPanelScreen;














