import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
// Assuming you are using Expo, Ionicons is built-in.
// If using bare React Native, you may need 'react-native-vector-icons/Ionicons'
import { Ionicons } from "@expo/vector-icons";
import authService from "../services/auth";
import { useToast, useLoading } from "../context/ToastContext";

const { width } = Dimensions.get("window");

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();

  // Real-time validation (Postel's Law - be liberal in accepting input)
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    switch (field) {
      case 'name':
        if (!value?.trim()) {
          newErrors.name = 'Username is required';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (!value?.trim()) {
          newErrors.phone = 'Phone number is required';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'password':
        if (!value?.trim()) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        // Re-validate confirm password if it exists
        if (confirmPassword) {
          validateField('confirmPassword', confirmPassword);
        }
        break;
      case 'confirmPassword':
        if (!value?.trim()) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (password && value !== password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    setErrors(newErrors);
  };

  const handleRegister = async () => {
    // Trim whitespace from all fields
    const trimmedName = name?.trim() || "";
    const trimmedEmail = email?.trim() || "";
    const trimmedPhone = phone?.trim() || "";
    const trimmedPassword = password?.trim() || "";
    const trimmedConfirmPassword = confirmPassword?.trim() || "";

    // Validate all fields
    validateField('name', trimmedName);
    validateField('email', trimmedEmail);
    validateField('phone', trimmedPhone);
    validateField('password', trimmedPassword);
    validateField('confirmPassword', trimmedConfirmPassword);

    // Check if any field is empty or has errors
    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedPassword || !trimmedConfirmPassword) {
      showError("Please fill in all fields");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      showError("Passwords do not match");
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      validateField('confirmPassword', trimmedConfirmPassword);
      return;
    }

    if (trimmedPassword.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      showError("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    showLoading('Creating account...');
    try {
      // Step 1: Register (saves data temporarily, doesn't create user yet)
      const response = await authService.register(
        trimmedEmail,
        trimmedPassword,
        trimmedName,
        trimmedPhone,
        "sender"
      );
      
      hideLoading();
      // Step 2: Navigate to phone verification screen
      if (response.tempRegistrationId && response.phone) {
        router.push({
          pathname: '/phone-verification',
          params: {
            phone: response.phone,
            purpose: 'registration',
            tempRegistrationId: response.tempRegistrationId
          }
        });
      } else {
        showError('Registration failed. Please try again.');
      }
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Register</Text>

          <View style={styles.inputGroup}>
            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#BDC3C7"
                  value={name || ""}
                  onChangeText={(text) => {
                    setName(text || "");
                    validateField('name', text);
                  }}
                  onBlur={() => validateField('name', name)}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#BDC3C7"
                  value={email || ""}
                  onChangeText={(text) => {
                    setEmail(text || "");
                    validateField('email', text);
                  }}
                  onBlur={() => validateField('email', email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#BDC3C7"
                  value={phone || ""}
                  onChangeText={(text) => {
                    setPhone(text || "");
                    validateField('phone', text);
                  }}
                  onBlur={() => validateField('phone', phone)}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#BDC3C7"
                  value={password || ""}
                  onChangeText={(text) => {
                    setPassword(text || "");
                    validateField('password', text);
                  }}
                  onBlur={() => validateField('password', password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#7F8C8D"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password again"
                  placeholderTextColor="#BDC3C7"
                  value={confirmPassword || ""}
                  onChangeText={(text) => {
                    setConfirmPassword(text || "");
                    validateField('confirmPassword', text);
                  }}
                  onBlur={() => validateField('confirmPassword', confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#7F8C8D"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLinkButton}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 80,
    paddingBottom: 40,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "left",
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputWrapper: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8ECF4",
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: 16,
    color: "#2C3E50",
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 12,
    paddingRight: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 12,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: "#0056b3",
    fontSize: 14,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#004aad", // Darker blue from image
    borderRadius: 6,
    paddingVertical: 16, // Increased for Fitts's Law (larger touch targets)
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    minHeight: 52, // Minimum touch target size (44pt + padding)
    // Removed heavy shadow to match flat design
  },
  inputError: {
    borderColor: "#F44336",
    borderWidth: 1.5,
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee", // Very faint line
  },
  separatorText: {
    marginHorizontal: 20,
    color: "#999",
    fontSize: 12,
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginLinkText: {
    color: "#888",
    fontSize: 15,
  },
  loginLinkButton: {
    color: "#004aad",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default RegisterScreen;
