import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get } from "firebase/database";

// Firebase configuration
// TODO: Replace with Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJ3fEKkfB-F925tXonxTWm10Fpfm5Tq0o",
  authDomain: "pathaideu-558a6.firebaseapp.com",
  databaseURL:
    "https://pathaideu-558a6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pathaideu-558a6",
  storageBucket: "pathaideu-558a6.firebasestorage.app",
  messagingSenderId: "386606523386",
  appId: "1:386606523386:web:bac3d2cd46cef0aae6fa43",
  measurementId: "G-MXRWRSEE35",
};

// Initialize Firebase
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
}

/**
 * Update courier location in Firebase Realtime Database
 * @param {string} deliveryId - Package/trip ID
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {boolean} isOnline - Whether the courier is currently online
 */
export const updateCourierLocation = async (deliveryId, lat, lng, isOnline = true) => {
  if (!database) {
    console.error("❌ Firebase database not initialized");
    throw new Error("Firebase database not initialized");
  }

  if (!deliveryId) {
    console.error("❌ Delivery ID is required");
    throw new Error("Delivery ID is required");
  }

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng)
  ) {
    console.error("❌ Invalid coordinates:", { lat, lng });
    throw new Error("Invalid coordinates");
  }

  try {
    const locationRef = ref(database, `active_deliveries/${deliveryId}`);
    const data = {
      lat,
      lng,
      timestamp: Date.now(),
      isOnline,
      lastSeen: Date.now(), // Always update lastSeen
    };
    console.log(
      `🔥 Firebase: Writing to active_deliveries/${deliveryId}:`,
      data
    );
    await set(locationRef, data);
    console.log(
      `✅ Firebase: Location updated successfully for delivery ${deliveryId}:`,
      {
        lat,
        lng,
        timestamp: data.timestamp,
        isOnline,
      }
    );
  } catch (error) {
    console.error("❌ Firebase: Error updating courier location:", error);
    console.error("❌ Firebase: Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Listen to courier location updates in real-time
 * @param {string} deliveryId - Package/trip ID
 * @param {function} callback - Callback function that receives { lat, lng, timestamp, isOnline, lastSeen }
 * @returns {function} Unsubscribe function
 */
export const listenToCourierLocation = (deliveryId, callback) => {
  if (!database) {
    console.error("❌ Firebase database not initialized");
    return () => {};
  }

  try {
    const locationRef = ref(database, `active_deliveries/${deliveryId}`);

    const unsubscribe = onValue(
      locationRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data && data.lat && data.lng) {
          callback({
            lat: data.lat,
            lng: data.lng,
            timestamp: data.timestamp,
            isOnline: data.isOnline !== false, // Default to true if not set
            lastSeen: data.lastSeen || data.timestamp,
          });
        } else {
          // This is normal when courier hasn't started tracking yet
          // Don't show warning as it's expected behavior
          console.log(
            `ℹ️ Waiting for courier location update for delivery ${deliveryId}`
          );
        }
      },
      (error) => {
        console.error("❌ Error listening to courier location:", error);
      }
    );

    // Return unsubscribe function
    return () => {
      unsubscribe(); // Use the unsubscribe function returned by onValue
      console.log(`✅ Stopped listening to delivery ${deliveryId}`);
    };
  } catch (error) {
    console.error("❌ Error setting up location listener:", error);
    return () => {};
  }
};

/**
 * Update courier online status
 * @param {string} deliveryId - Package/trip ID
 * @param {boolean} isOnline - Whether the courier is online
 */
export const updateCourierStatus = async (deliveryId, isOnline) => {
  if (!database) {
    console.error("❌ Firebase database not initialized");
    return;
  }

  try {
    const locationRef = ref(database, `active_deliveries/${deliveryId}`);
    const snapshot = await get(locationRef);
    
    const currentData = snapshot.val();
    if (currentData) {
      await set(locationRef, {
        ...currentData,
        isOnline,
        lastSeen: Date.now(),
      });
      console.log(`✅ Updated courier status for delivery ${deliveryId}: ${isOnline ? 'online' : 'offline'}`);
    }
  } catch (error) {
    console.error("❌ Error updating courier status:", error);
  }
};

/**
 * Remove courier location from Firebase when delivery is complete
 * @param {string} deliveryId - Package/trip ID
 */
export const removeCourierLocation = async (deliveryId) => {
  if (!database) {
    console.error("❌ Firebase database not initialized");
    return;
  }

  try {
    const locationRef = ref(database, `active_deliveries/${deliveryId}`);
    await set(locationRef, null);
    console.log(`✅ Removed location for delivery ${deliveryId}`);
  } catch (error) {
    console.error("❌ Error removing courier location:", error);
    throw error;
  }
};

export default {
  updateCourierLocation,
  listenToCourierLocation,
  removeCourierLocation,
  updateCourierStatus,
};
