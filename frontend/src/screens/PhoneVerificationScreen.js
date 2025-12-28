import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import phoneVerificationService from '../services/phoneVerification';
import authService from '../services/auth';
import { useToast } from '../context/ToastContext';
import useAuthStore from '../state/useAuthStore';
import createAPI from '../services/api';

const PhoneVerificationScreen = () => {
  const params = useLocalSearchParams();
  const { phone, purpose, tempRegistrationId, userId, firstName, lastName } = params;
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState({});
  const otpInputs = useRef([]);

  useEffect(() => {
    // Auto-send OTP on mount
    console.log('📱 PhoneVerificationScreen mounted with params:', params);
    console.log('📱 Extracted values:', { phone, purpose, tempRegistrationId, userId });
    
    if (phone) {
      handleSendOTP();
    } else {
      console.error('❌ No phone number provided to PhoneVerificationScreen');
      showError('Phone number is required');
    }
  }, [phone]);

  useEffect(() => {
    // Countdown timer for resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async (isResend = false) => {
    if (!phone) {
      showError('Phone number is required');
      return;
    }

    setSendingOTP(true);
    setErrors({});
    try {
      await phoneVerificationService.sendOTP(phone, purpose || 'registration', userId || null);
      showSuccess(isResend ? 'OTP resent successfully!' : 'OTP sent to your phone number');
      setResendCooldown(60); // 60 second cooldown
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data?.error || error.message || 'Failed to send OTP';
      
      let errorMessage = '';
      
      if (status === 429) {
        // Rate limiting
        const match = errorData.match(/Please wait (\d+) seconds/);
        if (match && match[1]) {
          const seconds = parseInt(match[1], 10);
          setResendCooldown(seconds);
          errorMessage = `⏳ Please wait ${seconds} seconds before requesting a new OTP.`;
        } else {
          errorMessage = '⏳ Please wait before requesting a new OTP.';
        }
      } else if (status === 400) {
        // Bad request
        if (errorData.includes('already registered')) {
          errorMessage = '📱 This phone number is already registered.';
        } else {
          errorMessage = errorData;
        }
      } else if (status === 500 || !status) {
        // Server or network error
        errorMessage = '🌐 Network error. Please check your connection and try again.';
      } else {
        errorMessage = errorData;
      }
      
      showError(errorMessage);
      console.error('❌ Error sending OTP:', {
        status,
        error: errorData,
        fullError: error.response?.data || error.message
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors({});

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (index, key) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue = null) => {
    const otpToVerify = otpValue || otp.join('');
    
    if (otpToVerify.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits' });
      showError('Please enter all 6 digits');
      return;
    }

    if (!/^\d{6}$/.test(otpToVerify)) {
      setErrors({ otp: 'OTP must be 6 digits' });
      showError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      console.log('🔐 Verifying OTP:', { phone, otp: otpToVerify, purpose: purpose || 'registration' });
      const verifyResponse = await phoneVerificationService.verifyOTP(phone, otpToVerify, purpose || 'registration', userId || null);
      console.log('✅ OTP verification successful:', verifyResponse);
      
      // Clear OTP inputs on success
      setOtp(['', '', '', '', '', '']);
      
      // Don't show success toast here - wait for registration to complete
      // showSuccess('Phone number verified successfully!');

      // Handle based on purpose
      if (purpose === 'registration' && tempRegistrationId) {
        // Complete registration - add small delay to ensure verification is saved
        try {
          console.log('🔄 Completing registration with tempRegistrationId:', tempRegistrationId);
          // Small delay to ensure verification record is saved to database
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('📤 Calling authService.completeRegistration...');
          const response = await authService.completeRegistration(tempRegistrationId);
          console.log('✅ Registration completed successfully. Response:', response);
          console.log('📋 Response type:', typeof response);
          console.log('📋 Response keys:', response ? Object.keys(response) : 'null');
          
          // Show success message and navigate to login page
          console.log('📢 Showing success message...');
          showSuccess('Account created successfully! Please login with your credentials.');
          
          console.log('⏳ Waiting 1.5 seconds before navigation...');
          setTimeout(() => {
            console.log('🧭 Navigating to login page...');
            router.replace('/login');
          }, 1500);
        } catch (error) {
          console.error('❌ Complete registration error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            error: error,
            stack: error.stack
          });
          
          // Extract error message safely
          let errorMessage = 'Failed to complete registration';
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          showError(errorMessage);
          setLoading(false); // Re-enable form on error
        }
      } else if (purpose === 'update_phone') {
        // Update phone number in profile
        try {
          const api = createAPI();
          const fullName = firstName && lastName ? `${firstName} ${lastName}`.trim() : null;
          
          await api.put('/api/auth/me', {
            phone: phone,
            ...(fullName && { name: fullName })
          });

          // Refresh user data
          const updatedUser = await authService.getMe();
          useAuthStore.getState().updateUser(updatedUser);
          showSuccess('Phone number updated successfully!');
          setTimeout(() => {
            router.back();
          }, 1000);
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to update phone number');
          // Don't clear OTP on error - let user retry
        }
      } else {
        // Default: go back
        router.back();
      }
    } catch (error) {
      // Handle different error scenarios with specific messages
      const status = error.response?.status;
      const errorData = error.response?.data?.error || error.message || 'Failed to verify OTP';
      
      let errorMessage = '';
      let errorType = '';
      
      if (status === 400) {
        // Bad request - could be wrong OTP, expired OTP, or invalid format
        if (errorData.includes('Invalid OTP')) {
          // Wrong OTP entered
          if (errorData.includes('attempt(s) remaining')) {
            errorMessage = errorData; // "Invalid OTP. X attempt(s) remaining."
            errorType = 'wrong_otp';
          } else {
            errorMessage = '❌ Wrong OTP entered. Please request a new OTP.';
            errorType = 'wrong_otp_max_attempts';
          }
        } else if (errorData.includes('expired') || errorData.includes('Invalid or expired')) {
          errorMessage = '⏰ OTP has expired. Please request a new OTP.';
          errorType = 'expired_otp';
        } else {
          errorMessage = errorData;
          errorType = 'invalid_request';
        }
      } else if (status === 429) {
        // Too many attempts
        errorMessage = '🚫 Too many failed attempts. Please request a new OTP.';
        errorType = 'too_many_attempts';
      } else if (status === 500 || !status) {
        // Server error or network error
        errorMessage = '🌐 Network error. Please check your connection and try again.';
        errorType = 'network_error';
      } else {
        // Other errors
        errorMessage = errorData;
        errorType = 'unknown_error';
      }
      
      setErrors({ otp: errorMessage });
      showError(errorMessage);
      console.error('❌ OTP Verification Error:', {
        type: errorType,
        status,
        error: errorData,
        fullError: error.response?.data || error.message
      });
      
      // Clear OTP inputs on error to allow retry (except for wrong OTP with attempts remaining)
      if (errorType === 'wrong_otp_max_attempts' || errorType === 'expired_otp' || errorType === 'too_many_attempts') {
        setOtp(['', '', '', '', '', '']);
        otpInputs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait-outline" size={64} color="#007AFF" />
          </View>

          <Text style={styles.title}>Verify Phone Number</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to{'\n'}
            <Text style={styles.phoneNumber}>{phone}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpInputs.current[index] = ref)}
                style={[styles.otpInput, errors.otp && styles.otpInputError]}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {errors.otp && (
            <Text style={styles.errorText}>{errors.otp}</Text>
          )}

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={loading || otp.some(digit => !digit)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={() => handleSendOTP(true)}
              disabled={sendingOTP || resendCooldown > 0}
            >
              {sendingOTP ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={[styles.resendButton, resendCooldown > 0 && styles.resendButtonDisabled]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22
  },
  phoneNumber: {
    fontWeight: '600',
    color: '#2C3E50'
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E8ECF4',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    backgroundColor: '#fff'
  },
  otpInputError: {
    borderColor: '#F44336'
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15
  },
  verifyButton: {
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
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  resendText: {
    color: '#7F8C8D',
    fontSize: 15
  },
  resendButton: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600'
  },
  resendButtonDisabled: {
    color: '#95A5A6'
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 5
  }
});

export default PhoneVerificationScreen;

