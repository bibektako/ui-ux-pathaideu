# Pathaideu Mobile App

React Native mobile application for the Pathaideu peer-to-peer package delivery system.

## Prerequisites

- Node.js (v16+)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)
- Backend server running and accessible via LAN IP

## Installation

```bash
npm install
```

## Configuration

1. Update backend IP in Settings screen after first launch
2. Default backend IP: `http://192.168.1.100:3000` (change to your server's LAN IP)

## Running

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web (limited functionality)
npm run web
```

## Project Structure

```
src/
├── state/
│   └── useAuthStore.js          # Zustand auth state management
├── screens/
│   ├── LoginScreen.js           # User login
│   ├── RegisterScreen.js        # User registration
│   ├── HomeScreen.js            # Dashboard
│   ├── CreatePackageScreen.js  # Create package listing
│   ├── CreateTripScreen.js     # Create trip
│   ├── PackageListScreen.js    # Browse packages
│   ├── PackageDetailScreen.js  # Package details & actions
│   ├── CaptureScreen.js        # Camera/photo capture
│   ├── TrackingScreen.js       # Real-time GPS tracking
│   ├── WalletScreen.js          # Wallet management
│   ├── ProfileScreen.js         # User profile
│   ├── AdminPanelScreen.js     # Admin functions
│   └── SettingsScreen.js       # App settings
├── components/
│   ├── CameraView.js            # Camera component
│   └── MapView.js              # MapLibre map component
├── services/
│   ├── api.js                  # Axios API client
│   ├── auth.js                 # Authentication service
│   ├── packages.js             # Package service
│   ├── trips.js                # Trip service
│   └── wallet.js               # Wallet service
└── utils/
    └── gps.js                  # GPS/location utilities
```

## Features

### User Roles

- **Sender**: Create packages, track deliveries, manage wallet
- **Traveller**: Create trips, accept packages, track deliveries
- **Admin**: Verify users, resolve disputes, manage system

### Key Features

- User authentication & registration
- Package creation & matching
- Trip creation & package acceptance
- Real-time GPS tracking with MapLibre
- Wallet management (top-up, escrow)
- Photo capture for verification & proof
- Admin verification panel
- Settings for backend IP configuration

## Permissions Required

- **Location**: For GPS tracking and route matching
- **Camera**: For photo capture (ID verification, package photos)
- **Photo Library**: For selecting images

## Notes

- App connects to backend via LAN IP (configure in Settings)
- All data stored locally on device (AsyncStorage for auth)
- MapLibre uses OpenStreetMap (no API key required)
- Camera requires physical device (not available in simulator)

## Troubleshooting

1. **Backend connection failed**: Check backend IP in Settings, ensure both devices on same network
2. **Location not working**: Grant location permissions in device settings
3. **Camera not working**: Use physical device (not simulator)
4. **Map not loading**: Check internet connection (OSM tiles require internet)
