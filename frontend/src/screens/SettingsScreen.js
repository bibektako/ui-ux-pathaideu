import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../state/useAuthStore";

const SettingsScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);

  const profileImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name || "User"
  )}&background=007AFF&color=fff&size=128`;

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: profileImageUrl }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "User"}</Text>
            <Text style={styles.profileEmail}>{user?.email || ""}</Text>
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#333"
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>My Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/history")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="list-outline"
                size={20}
                color="#333"
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>History...</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/trip-history")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="car-outline"
                size={20}
                color="#333"
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>Trip...</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/notifications")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#333"
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              // Navigate to addresses page when implemented
              console.log("Addresses pressed");
            }}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#333"
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>Addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              // Navigate to settings page when implemented
              console.log("Settings pressed");
            }}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="settings-outline"
                size={20}
                color="#333"
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="moon-outline"
                size={20}
                color="#333"
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>Dark mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#E0E0E0", true: "#007AFF" }}
              thumbColor={darkMode ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#F44336"
                style={styles.menuIcon}
              />
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Logout
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
  logoutText: {
    color: "#F44336",
  },
});

export default SettingsScreen;
