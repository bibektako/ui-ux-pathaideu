# Firebase Realtime Database Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Realtime Database

1. In Firebase Console, go to **Realtime Database**
2. Click "Create Database"
3. Choose your region (closest to your users)
4. Start in **test mode** (for development) or set up security rules

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (name it "Pathaideu")
5. Copy the Firebase configuration object

## Step 4: Update Firebase Configuration

Open `frontend/src/services/firebase.js` and replace the `firebaseConfig` object with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## Step 5: Set Up Security Rules (Important!)

In Firebase Console → Realtime Database → Rules, set up security rules:

```json
{
  "rules": {
    "active_deliveries": {
      "$deliveryId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**For production**, use authenticated rules:

```json
{
  "rules": {
    "active_deliveries": {
      "$deliveryId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Step 6: Test the Connection

### Important: Testing as Traveller vs Recipient

**Firebase only updates when the TRAVELLER (person carrying the package) opens the tracking screen.**

1. **To test Firebase writes (as Traveller)**:

   - Log in as the traveller who accepted the package
   - Open the tracking screen for that package
   - Check console logs for: `✅ User is traveller - starting courier tracking`
   - Check Firebase Console → Realtime Database
   - You should see `active_deliveries/{packageId}` with location data updating every 10 seconds

2. **To test Firebase reads (as Recipient/Sender)**:
   - Log in as the sender/recipient
   - Open the tracking screen
   - You'll see: `👂 User is recipient/sender - starting recipient tracking`
   - Firebase will show null until the traveller starts tracking
   - Once traveller starts tracking, you'll see location updates in real-time

### Quick Test Steps:

1. Start your app
2. **Log in as the traveller** (the user who accepted the package)
3. Open the tracking screen for an accepted package
4. Check console logs - you should see:
   - `✅ Firebase initialized successfully`
   - `✅ User is traveller - starting courier tracking`
   - `🔥 Updating Firebase for package {id}`
   - `✅ Firebase: Location updated successfully`
5. Check Firebase Console → Realtime Database
6. You should see `active_deliveries/{packageId}` with location data updating every 10 seconds

## Troubleshooting

### Error: "Firebase: Error (auth/configuration-not-found)"

- Make sure you've updated `firebaseConfig` in `frontend/src/services/firebase.js`
- Verify all configuration values are correct

### Error: "Permission denied"

- Check your Realtime Database security rules
- Make sure rules allow read/write access

### Location not updating / Data showing as null

1. **Check if you're the traveller**:

   - The tracking screen only updates Firebase if you're the traveller (person carrying the package)
   - If you're the sender/recipient, you'll only see listening logs, not update logs
   - Check console logs for: `✅ User is traveller - starting courier tracking`

2. **Check Firebase Security Rules**:

   - Go to Firebase Console → Realtime Database → Rules
   - Make sure rules allow writes:

   ```json
   {
     "rules": {
       "active_deliveries": {
         "$deliveryId": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

   - Click "Publish" after updating rules

3. **Check Console Logs**:

   - Look for these logs in your app console:
     - `✅ Firebase initialized successfully`
     - `📍 Requesting GPS permissions...`
     - `📍 Getting current location...`
     - `🔥 Updating Firebase for package {id} with location:`
     - `✅ Firebase: Location updated successfully`
   - If you see errors, check the error message

4. **Verify GPS Permissions**:

   - Make sure location permissions are granted
   - On iOS: Settings → Privacy → Location Services → Your App
   - On Android: Settings → Apps → Your App → Permissions → Location

5. **Check Package Status**:

   - Package must be accepted (status: 'accepted', 'picked_up', or 'in_transit')
   - Package must have a traveller assigned

6. **Verify Package ID**:

   - Check console logs for the package ID being used
   - Make sure it matches the ID in Firebase Console

7. **Test Firebase Connection**:
   - Open Firebase Console → Realtime Database
   - Try manually adding a test entry: `active_deliveries/test123` with `{ "lat": 27.7172, "lng": 85.3240, "timestamp": 1234567890 }`
   - If this fails, your security rules are blocking writes

## Database Structure

The Firebase Realtime Database structure will be:

```
active_deliveries/
  └── {packageId}/
      ├── lat: 27.7172
      ├── lng: 85.3240
      └── timestamp: 1234567890
```

## Notes

- Location updates happen every 10 seconds for couriers
- Location data is automatically removed when tracking screen unmounts
- For production, consider adding authentication and better security rules
- Firebase has free tier limits: 1GB storage, 10GB/month transfer
