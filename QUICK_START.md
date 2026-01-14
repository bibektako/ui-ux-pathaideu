# Quick Start Guide

## ✅ Current Status

**Backend Server:** ✅ Running on `http://localhost:3000`  
**Frontend Server:** ✅ Starting (Expo Dev Server)  
**MongoDB:** ✅ Detected at `/Users/bibektako/mongodb-macos-aarch64-8.0.11/bin/mongod`

## 📱 Mobile App Configuration

**Your LAN IP Address:** `192.168.2.105`

**Backend URL for Mobile:** `http://192.168.2.105:3000`

### To configure the mobile app:

1. Open the app on your device/simulator
2. Go to **Settings** screen
3. Enter backend IP: `http://192.168.2.105:3000`
4. Save

Or update the default in: `frontend/src/state/useAuthStore.js`

## 🚀 Running the Servers

### Backend (already running)
```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

### Frontend (already starting)
```bash
cd frontend
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## 🔍 Verify Everything Works

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Registration:**
   - Open app
   - Register a new account
   - Login

3. **Test Package Creation:**
   - Login as sender
   - Create a package
   - Check backend logs

## 📝 Important Notes

- **MongoDB must be running** before starting backend
- Backend runs on port **3000**
- Frontend uses Expo (default port **8081**)
- Both devices (computer + mobile) must be on **same WiFi network**

## 🐛 Troubleshooting

### Backend not connecting?
- Check MongoDB is running: `mongod` or check if it's a service
- Check port 3000 is not in use: `lsof -i :3000`

### Mobile can't connect?
- Verify both devices on same WiFi
- Check firewall settings
- Try `http://192.168.2.105:3000` in mobile browser first

### Frontend not starting?
- Check Node version: `node --version` (should be 16+)
- Clear cache: `npm start -- --clear`




















