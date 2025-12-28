import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import authService from "../services/auth";
import { useToast, useLoading } from "../context/ToastContext";

const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();

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
      <View style={styles.topSection}>
        {/* City Skyline Illustration */}
        <View style={styles.skylineContainer}>
          <View style={styles.skyline}>
            <View style={[styles.building, { height: 60, width: 35 }]} />
            <View style={[styles.building, { height: 80, width: 45 }]} />
            <View style={[styles.building, { height: 50, width: 30 }]} />
            <View style={[styles.building, { height: 70, width: 40 }]} />
            <View style={[styles.building, { height: 55, width: 35 }]} />
            <View style={[styles.building, { height: 90, width: 50 }]} />
            <View style={[styles.building, { height: 65, width: 38 }]} />
            <View style={[styles.building, { height: 75, width: 42 }]} />
          </View>
        </View>

        {/* Logo - Top Left */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="car-outline" size={28} color="#0047AB" />
          </View>
          <Text style={styles.logoText}>Pathaideu</Text>
        </View>
      </View>

      {/* White Form Section - 65% of screen */}
      <View style={styles.formSection}>
        <Text style={styles.title}>Log In</Text>
        <Text style={styles.welcomeText}>
          Welcome Back, You've been missed.
        </Text>

        <View style={styles.inputGroup}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
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
              <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
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
    position: "relative",
    overflow: "hidden",
  },
  skylineContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    opacity: 0.4,
  },
  skyline: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: "100%",
    paddingHorizontal: 10,
    paddingBottom: 0,
  },
  building: {
    backgroundColor: "#0066CC",
    borderRadius: 2,
    marginHorizontal: 2,
  },
  logoContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  logoBox: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  formSection: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingTop: 40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 15,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 35,
    fontWeight: "400",
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
    marginTop: 10,
  },
  forgotPasswordText: {
    color: "#0047AB",
    fontSize: 14,
    fontWeight: "500",
  },
  signInButton: {
    backgroundColor: "#0047AB",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 25,
    minHeight: 56,
    shadowColor: "#0047AB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8ECF4",
  },
  separatorText: {
    marginHorizontal: 18,
    color: "#95A5A6",
    fontSize: 14,
    fontWeight: "500",
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },
  registerLinkText: {
    color: "#7F8C8D",
    fontSize: 15,
  },
  registerLinkButton: {
    color: "#0047AB",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default LoginScreen;
