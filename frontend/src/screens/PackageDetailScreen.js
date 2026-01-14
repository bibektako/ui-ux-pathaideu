import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  TextInput
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import packagesService from '../services/packages';
import useAuthStore from '../state/useAuthStore';
import { useToast, useLoading } from '../context/ToastContext';
import Header from '../components/Header';
import { getImageUri } from '../utils/imageUtils';
import locationTrackingService from '../services/locationTracking';
import { removeCourierLocation } from '../services/firebase';

const statusSteps = [
  { key: 'created', label: 'Request Created' },
  { key: 'picked_up', label: 'Package Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' }
];

const PackageDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef([]);
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    loadPackage();
  }, [id]);

  const loadPackage = async () => {
    showLoading('Loading package details...');
    try {
      const pkg = await packagesService.getById(id);
      setPackageData(pkg);
    } catch (error) {
      showError('Failed to load package details');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleAccept = async () => {
    // Additional frontend check: prevent accepting own packages
    if (isSender) {
      showError('You cannot accept your own package');
      return;
    }

    Alert.prompt(
      'Accept Package',
      'Enter Trip ID:',
      async (tripId) => {
        if (!tripId) return;
        setActionLoading(true);
        showLoading('Accepting package...');
        try {
          await packagesService.accept(id, tripId);
          hideLoading();
          showSuccess('Package accepted successfully!');
          loadPackage();
        } catch (error) {
          hideLoading();
          const errorMessage = error.response?.data?.error || error.message || 'Failed to accept package';
          showError(errorMessage);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handlePickup = async () => {
    setActionLoading(true);
    showLoading('Marking package as picked up...');
    try {
      await packagesService.pickup(id);
      hideLoading();
      showSuccess('Package marked as picked up!');
      loadPackage();
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || 'Failed to mark as picked up');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    setActionLoading(true);
    showLoading('Marking package as delivered...');
    try {
      await packagesService.deliver(id);
      hideLoading();
      showSuccess('Package marked as delivered. OTP sent to sender\'s email for verification.');
      loadPackage();
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || 'Failed to mark package as delivered');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyDelivery = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      showError('Please enter all 6 digits of the OTP');
      return;
    }

    setActionLoading(true);
    showLoading('Verifying delivery...');
    try {
      await packagesService.verifyDelivery(id, otpValue);
      
      // Stop tracking and remove location from Firebase
      try {
        await locationTrackingService.stopTracking(id);
        await removeCourierLocation(id);
        console.log('✅ Stopped tracking for delivered package');
      } catch (trackingError) {
        console.error('❌ Error stopping tracking:', trackingError);
        // Don't fail the delivery verification if tracking stop fails
      }
      
      hideLoading();
      showSuccess('Package delivery verified successfully!');
      setOtp(['', '', '', '', '', '']); // Clear OTP
      loadPackage();
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || 'Failed to verify delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const getTrackId = () => packageData?.code || `PKG${(packageData?._id || '').slice(-6).toUpperCase()}`;


  const isStepCompleted = (stepKey) => {
    if (!packageData) return false;
    if (stepKey === 'created') return true;
    if (stepKey === 'picked_up') {
      return ['picked_up', 'in_transit', 'delivered'].includes(packageData.status);
    }
    if (stepKey === 'in_transit') {
      return ['in_transit', 'delivered'].includes(packageData.status);
    }
    if (stepKey === 'delivered') {
      return packageData.status === 'delivered';
    }
    return false;
  };

  const getTimeForStep = (stepKey) => {
    if (!packageData) return '';
    let date = null;
    if (stepKey === 'created') date = packageData.createdAt ? new Date(packageData.createdAt) : null;
    if (stepKey === 'picked_up') date = packageData.pickedUpAt ? new Date(packageData.pickedUpAt) : null;
    if (stepKey === 'in_transit') return packageData.status === 'in_transit' ? 'In progress' : '';
    if (stepKey === 'delivered') date = packageData.deliveredAt ? new Date(packageData.deliveredAt) : null;
    return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  if (!packageData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Package not found.</Text>
      </View>
    );
  }

  // Check if current user is the sender
  const senderId = packageData.senderId?._id || packageData.senderId;
  const isSender = senderId?.toString() === user?.id?.toString();

  // Action buttons logic
  // Cannot accept own packages or already accepted packages
  const canAccept = packageData.status === 'pending' && 
                    !packageData.travellerId && 
                    !isSender;
  const canPickup = packageData.travellerId?._id === user?.id && 
                    packageData.status === 'accepted';
  const canDeliver = packageData.travellerId?._id === user?.id && 
                     ['picked_up', 'in_transit'].includes(packageData.status);
  const canTrackLive = ['accepted', 'picked_up', 'in_transit'].includes(packageData.status);
  
  // Check if sender needs to verify delivery (package has deliveryOTP but not yet delivered)
  const canVerifyDelivery = isSender && 
    packageData.deliveryOTP && 
    packageData.status !== 'delivered';
  
  // Check if package is expired and user is sender
  const isExpired = packageData.status === 'expired';
  const canRelist = isExpired && isSender;
  
  // Debug logging
  if (isSender && packageData) {
    console.log('🔍 Delivery Verification Check:', {
      isSender,
      hasDeliveryOTP: !!packageData.deliveryOTP,
      status: packageData.status,
      canVerifyDelivery
    });
  }

  const handleRelist = () => {
    // Navigate to create package screen with package data as params
    router.push({
      pathname: '/create-package',
      params: {
        relist: 'true',
        packageId: packageData._id,
        itemName: packageData.description || '',
        quantity: '1', // Default quantity
        receiverName: packageData.receiverName || '',
        receiverPhone: packageData.receiverPhone || '',
        pickupCity: packageData.origin?.city || '',
        pickupAddress: packageData.origin?.address || '',
        pickupLat: packageData.origin?.coordinates?.lat?.toString() || '',
        pickupLng: packageData.origin?.coordinates?.lng?.toString() || '',
        dropoffCity: packageData.destination?.city || '',
        dropoffAddress: packageData.destination?.address || '',
        dropoffLat: packageData.destination?.coordinates?.lat?.toString() || '',
        dropoffLng: packageData.destination?.coordinates?.lng?.toString() || '',
        fee: packageData.fee?.toString() || '',
        payer: packageData.payer || 'sender',
        photos: packageData.photos?.join(',') || ''
      }
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Package Details" />
      
      {/* Track Live Button - Top Right (to avoid overlap with back button) */}
      {canTrackLive && (
        <TouchableOpacity
          style={[styles.trackLiveButton, { top: insets.top + 68 + 8 }]}
          onPress={() => router.push(`/tracking/${id}`)}
        >
          <Ionicons name="location" size={18} color="#007AFF" />
          <Text style={styles.trackLiveText}>Track Live</Text>
        </TouchableOpacity>
      )}

      {/* Expired Status Badge - Top Right (same position as Track Live) */}
      {isExpired && (
        <View style={[styles.expiredBadge, { top: insets.top + 68 + 8 }]}>
          <Ionicons name="time-outline" size={18} color="#F44336" />
          <Text style={styles.expiredBadgeText}>Expired</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Package Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="cube-outline" size={18} color="#111827" style={styles.cardHeaderIcon} />
            <Text style={styles.cardHeaderTitle}>Package Details</Text>
          </View>
          <Text style={styles.trackId}>Track ID: #{getTrackId()}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>
              {packageData.origin?.city}, {packageData.origin?.address}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={styles.detailValue}>
              {packageData.destination?.city}, {packageData.destination?.address}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Item:</Text>
            <Text style={styles.detailValue}>{packageData.description || 'Package'}</Text>
          </View>

          <View style={styles.partyRow}>
            <View style={styles.partyBlock}>
              <Text style={styles.partyLabel}>Sender</Text>
              <View style={styles.partyHeader}>
                {packageData.senderId?.profileImage ? (
                  <Image
                    source={{ uri: getImageUri(packageData.senderId.profileImage) }}
                    style={styles.partyAvatar}
                    onError={(error) => {
                      console.error('❌ Sender profile image error:', error.nativeEvent.error, packageData.senderId.profileImage);
                    }}
                  />
                ) : (
                  <View style={styles.partyAvatarPlaceholder}>
                    <Text style={styles.partyAvatarText}>
                      {(packageData.senderId?.name || 'S').substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.partyInfo}>
                  <Text style={styles.partyValue}>{packageData.senderId?.name || 'N/A'}</Text>
                  <Text style={styles.partySub}>{packageData.senderId?.phone || ''}</Text>
                </View>
              </View>
            </View>
            <View style={styles.partyBlock}>
              <Text style={styles.partyLabel}>Delivered By</Text>
              {packageData.travellerId ? (
                <View style={styles.partyHeader}>
                  {packageData.travellerId?.profileImage ? (
                    <Image
                      source={{ uri: getImageUri(packageData.travellerId.profileImage) }}
                      style={styles.partyAvatar}
                      onError={(error) => {
                        console.error('❌ Traveller profile image error:', error.nativeEvent.error, packageData.travellerId.profileImage);
                      }}
                    />
                  ) : (
                    <View style={styles.partyAvatarPlaceholder}>
                      <Text style={styles.partyAvatarText}>
                        {(packageData.travellerId?.name || 'T').substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.partyInfo}>
                    <Text style={styles.partyValue}>{packageData.travellerId?.name || 'Not assigned'}</Text>
                    <Text style={styles.partySub}>{packageData.travellerId?.phone || ''}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.partyValue}>Not assigned</Text>
              )}
            </View>
          </View>
        </View>

        {/* Delivery Status Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
          <View style={styles.timeline}>
            {statusSteps.map((step, index) => {
              const completed = isStepCompleted(step.key);
              const isLast = index === statusSteps.length - 1;
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.circle,
                        completed ? styles.circleCompleted : styles.circlePending
                      ]}
                    />
                    {!isLast && (
                      <View
                        style={[
                          styles.line,
                          isStepCompleted(statusSteps[index + 1].key)
                            ? styles.lineCompleted
                            : styles.linePending
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        completed && styles.stepTitleCompleted
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepTime}>{getTimeForStep(step.key)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        {canAccept && (
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Accept Package</Text>
            )}
          </TouchableOpacity>
        )}

        {canPickup && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pickupButton]}
            onPress={handlePickup}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
            )}
          </TouchableOpacity>
        )}

        {canDeliver && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliverButton]}
            onPress={handleDeliver}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Mark as Delivered</Text>
            )}
          </TouchableOpacity>
        )}

        {canRelist && (
          <TouchableOpacity
            style={[styles.actionButton, styles.relistButton]}
            onPress={handleRelist}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Relist Package</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canVerifyDelivery && (
          <View style={styles.verificationSection}>
            <View style={styles.verificationBanner}>
              <Ionicons name="mail-outline" size={20} color="#FF9800" />
              <Text style={styles.verificationText}>
                Package marked as delivered. Enter the OTP sent to your email to verify.
              </Text>
            </View>
            
            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (!otpInputs.current[index]) {
                      otpInputs.current[index] = ref;
                    }
                  }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.verifyButton, otp.join('').length !== 6 && styles.verifyButtonDisabled]}
              onPress={handleVerifyDelivery}
              disabled={actionLoading || otp.join('').length !== 6}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Verify Delivery</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* View Full History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.back()}
        >
          <Text style={styles.historyButtonText}>View Full History</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB'
  },
  errorText: {
    fontSize: 14,
    color: '#C62828'
  },
  trackLiveButton: {
    position: 'absolute',
    right: 16, // Changed from left to right to avoid overlap
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  trackLiveText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF'
  },
  expiredBadge: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F44336'
  },
  expiredBadgeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#F44336'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  cardHeaderIcon: {
    marginRight: 6
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827'
  },
  trackId: {
    fontSize: 12,
    color: '#6C7A89',
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  detailLabel: {
    fontSize: 13,
    color: '#6C7A89'
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    flexShrink: 1,
    textAlign: 'right'
  },
  partyRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12
  },
  partyBlock: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  partyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8
  },
  partyHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  partyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#E0E0E0'
  },
  partyAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  partyAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  partyInfo: {
    flex: 1
  },
  partyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  partySub: {
    fontSize: 12,
    color: '#6B7280'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  timeline: {
    paddingLeft: 4
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  timelineIndicator: {
    width: 32,
    alignItems: 'center'
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B0BEC5',
    backgroundColor: '#FFFFFF'
  },
  circleCompleted: {
    borderColor: '#00C853',
    backgroundColor: '#E8F5E9'
  },
  circlePending: {
    borderColor: '#CFD8DC',
    backgroundColor: '#FFFFFF'
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2
  },
  lineCompleted: {
    backgroundColor: '#00C853'
  },
  linePending: {
    backgroundColor: '#E0E0E0'
  },
  timelineContent: {
    flex: 1
  },
  stepTitle: {
    fontSize: 14,
    color: '#6C7A89',
    marginBottom: 2
  },
  stepTitleCompleted: {
    color: '#111827',
    fontWeight: '600'
  },
  stepTime: {
    fontSize: 12,
    color: '#9AA5B1'
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  acceptButton: {
    backgroundColor: '#4CAF50'
  },
  pickupButton: {
    backgroundColor: '#FF9800'
  },
  verificationSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2'
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  verificationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500'
  },
  verifyButton: {
    backgroundColor: '#FF9800'
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fff'
  },
  otpInputFilled: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0'
  },
  deliverButton: {
    backgroundColor: '#FF9800'
  },
  relistButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  historyButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  historyButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500'
  }
});

export default PackageDetailScreen;
