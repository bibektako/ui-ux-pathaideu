import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import authService from '../services/auth';
import { useToast } from '../context/ToastContext';

const ResetPasswordScreen = () => {
  const { token } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (!token) {
      showError('Invalid reset link. Please request a new password reset.');
      router.replace('/forgot-password');
    }
  }, [token]);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    switch (field) {
      case 'newPassword':
        if (!value?.trim()) {
          newErrors.newPassword = 'Password is required';
        } else if (value.length < 6) {
          newErrors.newPassword = 'Password must be at least 6 characters';
        } else {
          delete newErrors.newPassword;
        }
        // Re-validate confirm password if it exists
        if (confirmPassword) {
          validateField('confirmPassword', confirmPassword);
        }
        break;
      case 'confirmPassword':
        if (!value?.trim()) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (newPassword && value !== newPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    setErrors(newErrors);
  };

  const handleResetPassword = async () => {
    // Validate all fields
    validateField('newPassword', newPassword);
    validateField('confirmPassword', confirmPassword);

    if (!newPassword?.trim() || !confirmPassword?.trim()) {
      showError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      showSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (error) {
      showError(error.response?.data?.error || error.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={[styles.passwordContainer, errors.newPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your new password"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  validateField('newPassword', text);
                }}
                onBlur={() => validateField('newPassword', newPassword)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIconText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your new password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  validateField('confirmPassword', text);
                }}
                onBlur={() => validateField('confirmPassword', confirmPassword)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeIconText}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.loginLinkButton}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 35,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 35,
    fontWeight: '400',
    lineHeight: 22
  },
  inputGroup: {
    marginBottom: 22
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8ECF4'
  },
  inputError: {
    borderColor: '#F44336'
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50'
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 12
  },
  eyeIconText: {
    fontSize: 22
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  buttonDisabled: {
    opacity: 0.6
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10
  },
  loginLinkText: {
    color: '#7F8C8D',
    fontSize: 15
  },
  loginLinkButton: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600'
  }
});

export default ResetPasswordScreen;







