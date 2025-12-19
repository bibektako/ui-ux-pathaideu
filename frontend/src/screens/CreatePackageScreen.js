import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import packagesService from '../services/packages';
import gpsService from '../utils/gps';
import useAuthStore from '../state/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import createAPI from '../services/api';

const CreatePackageScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPackageTypeModal, setShowPackageTypeModal] = useState(false);
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupCoordinates: { lat: 0, lng: 0 },
    dropoffCoordinates: { lat: 0, lng: 0 },
    itemName: '',
    quantity: '1',
    packageType: '',
    receiverName: '',
    receiverPhone: '',
    payer: 'sender',
    fee: '',
    packagePhoto: null
  });

  const packageTypes = ['Documents', 'Electronics', 'Clothing', 'Food', 'Other'];

  const getCurrentLocation = async (type) => {
    try {
      const location = await gpsService.getCurrentLocation();
      const address = await gpsService.reverseGeocode(location.lat, location.lng);
      
      if (type === 'pickup') {
        setFormData(prev => ({
          ...prev,
          pickupLocation: `${address.address}, ${address.city}`,
          pickupCoordinates: { lat: location.lat, lng: location.lng }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          dropoffLocation: `${address.address}, ${address.city}`,
          dropoffCoordinates: { lat: location.lat, lng: location.lng }
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please enable location services.');
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, packagePhoto: result.assets[0] }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.pickupLocation || !formData.dropoffLocation || !formData.itemName || 
        !formData.receiverName || !formData.receiverPhone || !formData.fee) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const feeNumber = parseFloat(formData.fee);
    if (Number.isNaN(feeNumber) || feeNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid price/fee');
      return;
    }

    setLoading(true);
    try {
      // Parse locations to extract city and address
      const pickupParts = formData.pickupLocation.split(',').map(s => s.trim());
      const dropoffParts = formData.dropoffLocation.split(',').map(s => s.trim());
      
      const packageData = {
        origin: {
          city: pickupParts[pickupParts.length - 1] || pickupParts[0],
          address: formData.pickupLocation,
          coordinates: formData.pickupCoordinates.lat ? formData.pickupCoordinates : { lat: 0, lng: 0 }
        },
        destination: {
          city: dropoffParts[dropoffParts.length - 1] || dropoffParts[0],
          address: formData.dropoffLocation,
          coordinates: formData.dropoffCoordinates.lat ? formData.dropoffCoordinates : { lat: 0, lng: 0 }
        },
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        description: `${formData.itemName} (Qty: ${formData.quantity}, Type: ${formData.packageType || 'N/A'})`,
        fee: feeNumber,
        payer: formData.payer,
        photos: []
      };

      // Upload photo if selected
      if (formData.packagePhoto) {
        try {
          const api = createAPI();
          const formDataUpload = new FormData();
          formDataUpload.append('files', {
            uri: formData.packagePhoto.uri,
            type: 'image/jpeg',
            name: 'package.jpg'
          });
          formDataUpload.append('type', 'package_photo');

          const uploadResponse = await api.post('/api/submissions', formDataUpload, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (uploadResponse.data.submission?.files?.[0]) {
            packageData.photos = [uploadResponse.data.submission.files[0]];
          }
        } catch (error) {
          console.error('Photo upload failed:', error);
        }
      }

      await packagesService.create(packageData);
      Alert.alert('Success', 'Package request created successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Locations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>icon</Text>
            <Text style={styles.sectionTitle}>Locations</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pickup address"
              placeholderTextColor="#999"
              value={formData.pickupLocation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pickupLocation: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drop-off Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter drop-off address"
              placeholderTextColor="#999"
              value={formData.dropoffLocation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dropoffLocation: text }))}
            />
          </View>
        </View>

        {/* Package Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📦</Text>
            <Text style={styles.sectionTitle}>Package Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Documents, Electronics"
              placeholderTextColor="#999"
              value={formData.itemName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, itemName: text }))}
            />
          </View>

          <View style={styles.detailsRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#999"
                value={formData.quantity}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Package Type</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowPackageTypeModal(true)}
              >
                <Text style={[styles.selectText, !formData.packageType && styles.placeholderText]}>
                  {formData.packageType || 'Select'}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Price (Rs)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price"
              placeholderTextColor="#999"
              value={formData.fee}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fee: text }))}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receiver Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter receiver name"
              placeholderTextColor="#999"
              value={formData.receiverName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, receiverName: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receiver Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter receiver phone"
              placeholderTextColor="#999"
              value={formData.receiverPhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, receiverPhone: text }))}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.paymentQuestion}>Who will pay for this delivery?</Text>
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                formData.payer === 'sender' && styles.paymentButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, payer: 'sender' }))}
            >
              <Text style={[
                styles.paymentButtonText,
                formData.payer === 'sender' && styles.paymentButtonTextActive
              ]}>
                I'll Pay
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                formData.payer === 'receiver' && styles.paymentButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, payer: 'receiver' }))}
            >
              <Text style={[
                styles.paymentButtonText,
                formData.payer === 'receiver' && styles.paymentButtonTextActive
              ]}>
                Receiver Pays
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Package Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Photo</Text>
          <Text style={styles.photoInstruction}>Upload a photo of your package.</Text>
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handlePhotoUpload}
            activeOpacity={0.7}
          >
            {formData.packagePhoto ? (
              <Image
                source={{ uri: formData.packagePhoto.uri }}
                style={styles.uploadedImage}
                resizeMode="cover"
              />
            ) : (
              <>
                <View style={styles.uploadIconContainer}>
                  <Text style={styles.uploadIcon}>⬆</Text>
                </View>
                <Text style={styles.uploadText}>Click to upload or drag and drop</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Create Request Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Package Type Modal */}
      <Modal
        visible={showPackageTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPackageTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Package Type</Text>
            {packageTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, packageType: type }));
                  setShowPackageTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPackageTypeModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    padding: 15,
    paddingTop: 50,
    paddingBottom: 30
  },
  section: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333'
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfWidth: {
    flex: 1
  },
  selectInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectText: {
    fontSize: 16,
    color: '#333'
  },
  placeholderText: {
    color: '#999'
  },
  selectArrow: {
    fontSize: 12,
    color: '#999'
  },
  paymentQuestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginTop: 5
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 10
  },
  paymentButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  paymentButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  paymentButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  paymentButtonTextActive: {
    color: '#fff'
  },
  photoInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginTop: 5
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    minHeight: 150
  },
  uploadIconContainer: {
    marginBottom: 10
  },
  uploadIcon: {
    fontSize: 40,
    color: '#999'
  },
  uploadText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  buttonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333'
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333'
  },
  modalCancel: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  }
});

export default CreatePackageScreen;
