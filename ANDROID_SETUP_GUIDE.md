# Android Device Setup Guide

## Quick Start

### Step 1: Install Expo Go on Your Android Device

1. Open Google Play Store on your Android device
2. Search for "Expo Go"
3. Install the app

### Step 2: Start the Expo Development Server

**Option A: Using LAN (Recommended - Same WiFi)**

```bash
cd frontend
npx expo start --lan
```

**Option B: Using Tunnel (Works on different networks)**

```bash
cd frontend
npx expo start --tunnel
```

**Option C: Using Android directly**

```bash
cd frontend
npx expo start --android
```

### Step 3: Connect Your Device

1. **If using LAN mode:**

   - Make sure your computer and Android device are on the **same WiFi network**
   - Scan the QR code shown in the terminal with Expo Go app
   - OR manually enter the URL shown (e.g., `exp://192.168.1.100:8081`)

2. **If using Tunnel mode:**
   - Scan the QR code with Expo Go app
   - This works even if devices are on different networks

### Step 4: Configure Backend IP

Once the app opens, you need to configure the backend IP:

1. Go to **Settings** in the app
2. Find the **Backend IP** field
3. Enter your computer's local IP address (e.g., `http://192.168.1.100:3000`)

**To find your computer's IP:**

- **Mac/Linux:** Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** Run `ipconfig` and look for IPv4 Address

## Troubleshooting

### Issue: "java.io.ioexception:failed to download remote update"

**This error means your Android device can't connect to the Expo dev server.**

**Solutions:**

1. **Clear Expo Go cache:**

   - Open Expo Go app
   - Shake your device (or press Ctrl+M / Cmd+M)
   - Select "Reload" or "Clear cache"
   - Or uninstall and reinstall Expo Go

2. **Check network connectivity:**

   - Make sure your phone and computer are on the **same WiFi network**
   - Try disconnecting and reconnecting to WiFi on both devices
   - Disable VPN if you're using one

3. **Restart Expo server with correct mode:**

   ```bash
   # Stop current server (Ctrl+C)
   # Then restart with LAN mode:
   cd frontend
   npx expo start --clear --lan
   ```

   Or try tunnel mode:

   ```bash
   npx expo start --clear --tunnel
   ```

4. **Check firewall settings:**

   - Make sure your firewall allows connections on port 8081 (Expo default)
   - Allow Node.js through firewall
   - Temporarily disable firewall to test

5. **Verify Expo server is accessible:**

   - On your Android device, open a browser
   - Try accessing: `http://YOUR_COMPUTER_IP:8081`
   - Should see Expo dev tools page

6. **Use tunnel mode (works across networks):**

   ```bash
   cd frontend
   npx expo start --tunnel
   ```

   - This creates a public URL that works from anywhere
   - Scan the QR code again

7. **Check if port 8081 is in use:**

   ```bash
   # Mac/Linux:
   lsof -i :8081

   # Windows:
   netstat -ano | findstr :8081
   ```

   - Kill any process using port 8081 if needed

8. **Try different connection method:**

   - Instead of scanning QR code, manually enter the URL
   - In Expo Go, tap "Enter URL manually"
   - Enter: `exp://YOUR_COMPUTER_IP:8081`

9. **Reset Metro bundler:**

   ```bash
   cd frontend
   npx expo start --clear
   ```

10. **Check Expo Go version:**
    - Update Expo Go to the latest version from Play Store
    - Old versions may have connectivity issues

### Issue: "Unable to connect to Expo"

**Solutions:**

- Make sure Expo Go is installed
- Check that your device and computer are on the same WiFi
- Try using `--tunnel` mode instead
- Restart the Expo server: `npx expo start --clear`

### Issue: "Network Error" or "Cannot connect to backend"

**Solutions:**

1. **Check backend is running:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Find your computer's IP address:**

   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
   - Linux: `hostname -I`

3. **Update backend IP in app:**

   - Go to Settings → Backend IP
   - Enter: `http://YOUR_IP:3000` (e.g., `http://192.168.1.100:3000`)

4. **Check firewall:**

   - Make sure port 3000 is not blocked
   - Allow Node.js through firewall if prompted

5. **Test backend connection:**
   - On your Android device, open a browser
   - Go to: `http://YOUR_IP:3000/api/health`
   - Should see a response

### Issue: "Metro bundler error"

**Solutions:**

- Clear cache: `npx expo start --clear`
- Restart Metro bundler
- Check for syntax errors in your code

### Issue: App opens but shows blank screen

**Solutions:**

- Check the Expo Go console for errors
- Make sure backend is running and accessible
- Verify backend IP is correct in Settings
- Check network connectivity

## Alternative: Build APK (For Testing Without Expo Go)

If you want to test without Expo Go:

```bash
cd frontend
npx expo build:android
```

This will create an APK file you can install directly on your device.

## Network Configuration

### For Android Physical Device:

- The app uses your computer's LAN IP (not localhost)
- Format: `http://YOUR_COMPUTER_IP:3000`
- Example: `http://192.168.1.100:3000`

### Finding Your IP Address:

**Mac:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

**Windows:**

```bash
ipconfig | findstr /i "IPv4"
```

**Linux:**

```bash
hostname -I | awk '{print $1}'
```

## Quick Commands

```bash
# Start Expo with LAN (same WiFi)
cd frontend && npx expo start --lan

# Start Expo with Tunnel (any network)
cd frontend && npx expo start --tunnel

# Start Expo for Android directly
cd frontend && npx expo start --android

# Clear cache and start
cd frontend && npx expo start --clear

# Start backend
cd backend && npm run dev
```

## Common Ports

- **Expo Dev Server:** 8081 (default)
- **Backend API:** 3000 (default)
- Make sure both are accessible from your device
