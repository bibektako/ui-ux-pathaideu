import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import useAuthStore from "../state/useAuthStore";

const createAPI = () => {
  const getBaseURL = () => {
    const isIOS = Platform.OS === "ios";
    const isAndroid = Platform.OS === "android";

    // Check if we're in development mode (simulator is always in dev mode)
    const isDev = typeof __DEV__ !== "undefined" && __DEV__ === true;

    // Simulator/Emulator detection
    // - iOS: Constants.isDevice === false (simulator)
    // - Android: Constants.isDevice === false (emulator)
    // Note: In Expo Go, Constants.isDevice can be undefined for physical devices
    // So we only treat as emulator if isDevice is explicitly false (not undefined)
    const isIOSSimulator = isIOS && Constants.isDevice === false;
    // Only treat as Android emulator if isDevice is explicitly false
    // Physical devices in Expo Go often have isDevice as undefined, not false
    const isAndroidEmulator = isAndroid && Constants.isDevice === false;

    // Debug logging
    console.log("🔍 Device Detection:", {
      platform: Platform.OS,
      isDevice: Constants.isDevice,
      executionEnvironment: Constants.executionEnvironment,
      appOwnership: Constants.appOwnership,
      isDev,
      detectedAsSimulator: isIOSSimulator || isAndroidEmulator,
    });

    // Always use localhost for iOS simulator (ignores stored IP)
    if (isIOSSimulator) {
      console.log("🔵 [iOS Simulator] Using localhost:3000");
      return "http://localhost:3000";
    }

    // Helper to derive a LAN IP from Expo host if available
    const getDerivedLanURL = () => {
      try {
        const hostUri =
          // Newer Expo config
          Constants.expoConfig?.hostUri ||
          // Older manifest formats
          Constants.manifest2?.extra?.expoClient?.hostUri ||
          Constants.manifest?.debuggerHost;

        if (hostUri) {
          const host = hostUri.split(":")[0];
          if (
            host &&
            host !== "localhost" &&
            host !== "127.0.0.1" &&
            host !== "10.0.2.2"
          ) {
            const url = `http://${host}:3000`;
            console.log("🔵 [Auto-detected] Using Expo host-derived IP:", url);
            return url;
          }
        }
      } catch (e) {
        console.log("⚠️ Failed to derive LAN IP from Expo config:", e?.message);
      }
      return null;
    };

    // Get stored IP from settings
    const storedIP = useAuthStore.getState().backendIP;
    const derivedIP = getDerivedLanURL();

    // Priority order for physical devices:
    // 1. Stored IP (if set by user in Settings)
    // 2. Auto-detected IP from Expo hostUri (most reliable)
    // 3. Android emulator special IP
    // 4. Hard-coded fallback (last resort)

    // For physical devices, prefer auto-detected IP over stored IP if stored IP looks wrong
    // (stored IP might be from a different network)
    if (isAndroidEmulator) {
      console.log("🟢 [Android Emulator] Using 10.0.2.2:3000");
      return "http://10.0.2.2:3000";
    }

    // For physical devices, try auto-detected IP first (most reliable)
    if (derivedIP) {
      console.log("🔵 [Physical Device] Using auto-detected IP:", derivedIP);
      return derivedIP;
    }

    // Fallback to stored IP if available
    if (
      storedIP &&
      !storedIP.includes("localhost") &&
      !storedIP.includes("10.0.2.2")
    ) {
      console.log("🔵 [Physical Device] Using stored IP:", storedIP);
      return storedIP;
    }

    // Final hard-coded fallback if nothing else works
    console.log("⚠️ [Fallback] Using hard-coded IP: http://10.12.31.204:3000");
    console.log(
      "💡 Tip: Update Backend IP in Settings to match your Mac's LAN IP"
    );
    return "http://10.12.31.204:3000";
  };

  const api = axios.create({
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  api.interceptors.request.use(
    (config) => {
      // Dynamically set baseURL on each request (in case it changed)
      config.baseURL = getBaseURL();

      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Only logout on 401 if it's from an auth endpoint (not from other endpoints)
      // This prevents accidental logout during token validation
      if (error.response?.status === 401) {
        const url = error.config?.url || "";
        // Only logout if it's not the /api/auth/me endpoint (used for token validation)
        // or if it's a clear authentication failure
        if (!url.includes("/api/auth/me")) {
          // For other endpoints, logout on 401
          await useAuthStore.getState().logout();
        }
        // For /api/auth/me, let the calling code handle it
      }

      if (!error.response) {
        const baseURL = getBaseURL();
        console.error("Network Error:", {
          message: error.message,
          baseURL: baseURL,
          code: error.code,
        });

        // Provide helpful error message for network issues
        if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
          console.error("❌ Cannot reach backend server!");
          console.error("📱 Troubleshooting steps:");
          console.error(
            "1. Make sure your backend server is running: node backend/server.js"
          );
          console.error(
            "2. Check if backend is accessible from your Mac browser:"
          );
          console.error(`   Open: ${baseURL}/api/health`);
          console.error("3. If using a physical device, ensure:");
          console.error("   - Phone and Mac are on the SAME Wi-Fi network");
          console.error(
            "   - Backend IP in Settings matches your Mac's LAN IP"
          );
          console.error("   - Mac firewall allows connections on port 3000");
          console.error("4. To find your Mac's IP:");
          console.error("   System Settings → Network → Wi-Fi → Details");
          console.error(`5. Current configured IP: ${baseURL}`);
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
};

export default createAPI;
