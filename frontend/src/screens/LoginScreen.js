import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import authService from "../services/auth";
import { useToast, useLoading } from "../context/ToastContext";
import useAuthStore from "../state/useAuthStore";

const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const { isAuthenticated, user, isLoadingAuth } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      // Use setTimeout to ensure router is ready
      const timer = setTimeout(() => {
        if (user?.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isLoadingAuth]);

  // Show nothing while checking auth state
  if (isLoadingAuth || isAuthenticated) {
    return null;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      showError("Please fill in all fields");
      return;
    }

    setLoading(true);
    showLoading('Logging in...');
    try {
      const { user } = await authService.login(email, password);
      hideLoading();
      showSuccess("Login successful!");
      // Small delay for better UX (Peak-End Rule - positive ending)
      setTimeout(() => {
        // Redirect based on user role
        if (user?.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace("/(tabs)");
        }
      }, 300);
    } catch (error) {
      hideLoading();
      showError(error.response?.data?.error || error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Top Blue Section with Skyline - 35% of screen */}
      {/* Top Blue Section */}
      <View style={styles.topSection}>
        {/* Logo Card */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <View style={styles.logoIconContainer}>
              <Image
                source={require('../../assets/images/app-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>Pathaideu</Text>
          </View>
        </View>
      </View>

      {/* White Form Section - 65% of screen */}
      <View style={styles.formSection}>
        <Text style={styles.title}>Log In</Text>
        <Text style={styles.welcomeText}>
          Welcome Back, You've been missed.
        </Text>

        <View style={styles.inputGroup}>
          {/* Username Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#BDC3C7"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#BDC3C7"
                value={password}
                onChangeText={setPassword}
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
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        <View style={styles.registerLink}>
          <Text style={styles.registerLinkText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.registerLinkButton}>Register</Text>
          </TouchableOpacity>
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
  topSection: {
    height: "35%",
    backgroundColor: "#0047AB",
    paddingTop: 60,
    paddingLeft: 30,
    justifyContent: "center",
  },
  // Removed skyline styles
  logoContainer: {
    marginBottom: 20,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#0047AB",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  logoIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 40,
    height: 40,
    tintColor: "#fff",
    marginBottom: 5,
  },
  logoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
  },
  formSection: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: "#808080",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 50,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A1A",
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: "#0047AB",
    fontSize: 14,
    fontWeight: "600",
  },
  signInButton: {
    backgroundColor: "#0047AB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#0047AB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  separatorText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerLinkText: {
    color: "#6B7280",
    fontSize: 14,
  },
  registerLinkButton: {
    color: "#0047AB",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default LoginScreen;
