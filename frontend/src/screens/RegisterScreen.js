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
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
// Assuming you are using Expo, Ionicons is built-in.
// If using bare React Native, you may need 'react-native-vector-icons/Ionicons'
import { Ionicons } from "@expo/vector-icons";
import authService from "../services/auth";

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
  const router = useRouter();

  const handleRegister = async () => {
    // Trim whitespace from all fields
    const trimmedName = name?.trim() || "";
    const trimmedEmail = email?.trim() || "";
    const trimmedPhone = phone?.trim() || "";
    const trimmedPassword = password?.trim() || "";
    const trimmedConfirmPassword = confirmPassword?.trim() || "";

    // Check if any field is empty with more specific error messages
    if (!trimmedName || trimmedName.length === 0) {
      Alert.alert("Error", "Please enter your username");
      return;
    }

    if (!trimmedEmail || trimmedEmail.length === 0) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!trimmedPhone || trimmedPhone.length === 0) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (!trimmedPassword || trimmedPassword.length === 0) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    if (!trimmedConfirmPassword || trimmedConfirmPassword.length === 0) {
      Alert.alert("Error", "Please confirm your password");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await authService.register(
        trimmedEmail,
        trimmedPassword,
        trimmedName,
        trimmedPhone,
        "sender"
      );
      Alert.alert("Success", "Account created! Please login.");
      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error.response?.data?.error || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Register</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#B0B0B0"
              value={name || ""}
              onChangeText={(text) => setName(text || "")}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#B0B0B0"
              value={email || ""}
              onChangeText={(text) => setEmail(text || "")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#B0B0B0"
              value={phone || ""}
              onChangeText={(text) => setPhone(text || "")}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoComplete="tel"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#B0B0B0"
                value={password || ""}
                onChangeText={(text) => setPassword(text || "")}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="oneTimeCode"
                autoComplete="off"
                passwordRules=""
                keyboardType="default"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#B0B0B0"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password again"
                placeholderTextColor="#B0B0B0"
                value={confirmPassword || ""}
                onChangeText={(text) => setConfirmPassword(text || "")}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                textContentType="oneTimeCode"
                autoComplete="off"
                passwordRules=""
                keyboardType="default"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#B0B0B0"
                />
              </TouchableOpacity>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E8E8E8", // Lighter border
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#333",
  },
  eyeIcon: {
    padding: 10,
    paddingRight: 15,
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
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    // Removed heavy shadow to match flat design
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
