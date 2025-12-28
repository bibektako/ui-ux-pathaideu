import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CameraView from '../components/CameraView';
import createAPI from '../services/api';

const CaptureScreen = () => {
  const router = useRouter();
  const { packageId, type } = useLocalSearchParams();
  const [showCamera, setShowCamera] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleCapture = (photo) => {
    setCapturedImage(photo);
    setShowCamera(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  const handleUpload = async () => {
    if (!capturedImage) return;

    setUploading(true);
    try {
      const api = createAPI();
      const formData = new FormData();
      
      formData.append('files', {
        uri: capturedImage.uri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      formData.append('type', type || 'package_photo');
      if (packageId) {
        formData.append('packageId', packageId);
      }

      await api.post('/api/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Alert.alert('Success', 'Photo uploaded successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView
        onCapture={handleCapture}
        onClose={() => router.back()}
        mode="camera"
      />
    );
  }

  return (
    <View style={styles.container}>
      {capturedImage && (
        <Image source={{ uri: capturedImage.uri }} style={styles.preview} />
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  preview: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#000'
  },
  button: {
    padding: 15,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center'
  },
  retakeButton: {
    backgroundColor: '#666'
  },
  uploadButton: {
    backgroundColor: '#007AFF'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default CaptureScreen;


















