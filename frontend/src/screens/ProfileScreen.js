import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../state/useAuthStore';
import createAPI from '../services/api';
import authService from '../services/auth';

const ProfileScreen = () => {
  const { user, updateUser } = useAuthStore();
  const [idNumber, setIdNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [existingIdSubmission, setExistingIdSubmission] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  
  // Split name into first and last name
  const nameParts = (user?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

  useEffect(() => {
    const syncFromUser = async () => {
      if (user) {
        const namePartsLocal = (user.name || '').split(' ');
        setFirstName(namePartsLocal[0] || '');
        setLastName(namePartsLocal.slice(1).join(' ') || '');
        setPhoneNumber(user.phone || '');

        // Fetch existing ID verification submission (if any)
        try {
          setLoadingExisting(true);
          const api = createAPI();
          const response = await api.get('/api/submissions', {
            params: { type: 'id_verification' }
          });
          const submissions = response.data?.submissions || [];
          setExistingIdSubmission(submissions.length > 0 ? submissions[0] : null);
        } catch (error) {
          // If this fails, we just won't show existing docs
          setExistingIdSubmission(null);
        } finally {
          setLoadingExisting(false);
        }
      }
    };

    syncFromUser();
  }, [user]);

  // Helper to get base URL for images from API client
  const getBaseURL = () => {
    const api = createAPI();
    const baseURL = api?.defaults?.baseURL || '';
    return baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  };

  const handleChangePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled) {
        // Upload profile photo to backend as traveller_photo
        const api = createAPI();
        const formData = new FormData();

        formData.append('files', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg'
        });
        formData.append('type', 'traveller_photo');

        await api.post('/api/submissions', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Refresh user to get updated profileImage path
        const updatedUser = await authService.getMe();
        updateUser(updatedUser);

        Alert.alert('Success', 'Profile photo updated');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to update profile photo'
      );
    }
  };

  const handleUploadIDPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8
      });

      if (!result.canceled) {
        setIdPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSubmitVerification = async () => {
    if (!idNumber || !idPhoto) {
      Alert.alert('Error', 'Please fill in ID number and upload ID photo');
      return;
    }

    setUploading(true);
    try {
      const api = createAPI();
      const formData = new FormData();
      
      formData.append('files', {
        uri: idPhoto,
        type: 'image/jpeg',
        name: 'id.jpg'
      });
      formData.append('type', 'id_verification');
      formData.append('metadata', JSON.stringify({ idNumber }));

      await api.post('/api/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Alert.alert('Success', 'ID submitted for verification. Waiting for admin approval.');
      const updatedUser = await authService.getMe();
      updateUser(updatedUser);
      setIdNumber('');
      setIdPhoto(null);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit verification');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateInformation = async () => {
    if (!firstName || !lastName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setUpdating(true);
    try {
      const api = createAPI();
      const fullName = `${firstName} ${lastName}`.trim();
      
      await api.put('/api/auth/me', {
        name: fullName,
        phone: phoneNumber
      });

      const updatedUser = await authService.getMe();
      updateUser(updatedUser);
      Alert.alert('Success', 'Information updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update information');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* User Profile Section */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image
                source={{ uri: `${getBaseURL()}/${user.profileImage}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || 'U').substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Section */}
        <View style={styles.card}>
          {!user?.verified && (
            <View style={styles.verificationAlert}>
              <Ionicons name="alert-circle" size={20} color="#000" />
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>Verification Required</Text>
                <Text style={styles.alertSubtitle}>Verify your identity to use all features</Text>
              </View>
            </View>
          )}
          
          <Text style={styles.sectionTitle}>National ID Verification</Text>
          <Text style={styles.sectionSubtitle}>Upload your citizenship or national ID card</Text>

          {/* Existing verification info */}
          {!loadingExisting && existingIdSubmission && (
            <View style={styles.existingInfo}>
              <View style={styles.existingHeader}>
                <Text style={styles.existingTitle}>Existing Document</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    existingIdSubmission.status === 'approved'
                      ? styles.statusApproved
                      : existingIdSubmission.status === 'rejected'
                      ? styles.statusRejected
                      : styles.statusPending
                  ]}
                >
                  {existingIdSubmission.status.charAt(0).toUpperCase() +
                    existingIdSubmission.status.slice(1)}
                </Text>
              </View>
              {existingIdSubmission.metadata?.idNumber && (
                <Text style={styles.existingText}>
                  ID Number: {existingIdSubmission.metadata.idNumber}
                </Text>
              )}
              {existingIdSubmission.files &&
                existingIdSubmission.files.length > 0 && (
                  <Image
                    source={{
                      uri: `${getBaseURL()}/${existingIdSubmission.files[0]}`
                    }}
                    style={styles.existingImage}
                  />
                )}
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your citizenship/ID number"
              placeholderTextColor="#999"
              value={idNumber}
              onChangeText={setIdNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID Card Photo</Text>
            <TouchableOpacity style={styles.uploadArea} onPress={handleUploadIDPhoto}>
              {idPhoto ? (
                <Image source={{ uri: idPhoto }} style={styles.uploadedImage} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color="#666" />
                  <Text style={styles.uploadText}>Click to upload ID photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {!user?.verified && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitVerification}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Information Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateInformation}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#333" />
            ) : (
              <Text style={styles.updateButtonText}>Update Information</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    padding: 20,
    paddingTop: 40
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0'
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff'
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
  },
  changePhotoButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center'
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  verificationAlert: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center'
  },
  alertTextContainer: {
    marginLeft: 12,
    flex: 1
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#666'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 16
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333'
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover'
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12
  },
  existingInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  existingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  existingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  existingText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8
  },
  existingImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    resizeMode: 'cover'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden'
  },
  statusApproved: {
    backgroundColor: '#E0F7E9',
    color: '#2E7D32'
  },
  statusPending: {
    backgroundColor: '#FFF7E0',
    color: '#FF8F00'
  },
  statusRejected: {
    backgroundColor: '#FDECEA',
    color: '#C62828'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  updateButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  updateButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ProfileScreen;
