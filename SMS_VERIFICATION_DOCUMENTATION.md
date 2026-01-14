# SMS Phone Verification Feature Documentation

## Overview

This feature implements SMS-based phone number verification for user registration and phone number updates. Users must verify their phone number via a 6-digit OTP sent via SMS before completing registration or updating their phone number.

## Architecture

### Backend Components

#### 1. **Phone Verification Model** (`backend/models/phoneVerification.model.js`)

- Stores OTP codes, phone numbers, verification status, and expiry times
- Auto-expires OTPs after 10 minutes (configurable)
- Tracks verification attempts (max 5 attempts)
- Indexed for fast lookups

#### 2. **SMS Service** (`backend/services/sms.service.js`)

- Supports multiple SMS providers:
  - **Twilio** (production)
  - **AWS SNS** (production)
  - **Console** (development - logs OTP to console)
- Generates 6-digit OTP codes
- Formats phone numbers to E.164 format (+977XXXXXXXXX for Nepal)

#### 3. **Phone Verification Routes** (`backend/routes/phoneVerification.js`)

- `POST /api/phone-verification/send` - Send OTP to phone number
- `POST /api/phone-verification/verify` - Verify OTP code
- `GET /api/phone-verification/status` - Check verification status

#### 4. **Updated Auth Routes** (`backend/routes/auth.js`)

- `POST /api/auth/register` - Now stores registration data temporarily and returns `tempRegistrationId`
- `POST /api/auth/complete-registration` - Completes registration after phone verification
- `PUT /api/auth/me` - Requires phone verification when phone number is changed

### Frontend Components

#### 1. **Phone Verification Screen** (`frontend/src/screens/PhoneVerificationScreen.js`)

- 6-digit OTP input with auto-focus
- Auto-submit when all digits entered
- Resend OTP with 60-second cooldown
- Handles both registration and phone update flows

#### 2. **Phone Verification Service** (`frontend/src/services/phoneVerification.js`)

- `sendOTP()` - Request OTP
- `verifyOTP()` - Verify OTP code
- `checkStatus()` - Check if phone is verified

#### 3. **Updated Registration Flow** (`frontend/src/screens/RegisterScreen.js`)

- After filling registration form, navigates to phone verification
- Completes registration after successful verification

#### 4. **Updated Profile Screen** (`frontend/src/screens/ProfileScreen.js`)

- Detects phone number changes
- Navigates to verification screen if phone changed
- Updates phone after verification

## Flow Diagrams

### Registration Flow

```
1. User fills registration form
   ↓
2. POST /api/auth/register
   - Validates data
   - Checks for existing email/phone
   - Stores data temporarily
   - Returns tempRegistrationId
   ↓
3. Navigate to Phone Verification Screen
   ↓
4. Auto-send OTP on screen load
   POST /api/phone-verification/send
   - Generates 6-digit OTP
   - Sends via SMS
   - Stores in database (expires in 10 min)
   ↓
5. User enters OTP
   ↓
6. POST /api/phone-verification/verify
   - Validates OTP
   - Marks as verified
   ↓
7. POST /api/auth/complete-registration
   - Checks phone verification
   - Creates user account
   - Returns JWT token
   ↓
8. User logged in and redirected to home
```

### Phone Update Flow

```
1. User updates phone number in profile
   ↓
2. ProfileScreen detects phone change
   ↓
3. Navigate to Phone Verification Screen
   ↓
4. Auto-send OTP to new phone number
   POST /api/phone-verification/send (purpose: 'update_phone')
   ↓
5. User enters OTP
   ↓
6. POST /api/phone-verification/verify
   - Validates OTP
   - Marks as verified
   ↓
7. PUT /api/auth/me
   - Checks phone verification
   - Updates phone number
   ↓
8. Profile updated successfully
```

## Configuration

### Environment Variables

Add these to your `backend/.env` file:

```env
# SMS Provider: 'twilio', 'aws', or 'console' (for development)
SMS_PROVIDER=console

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS SNS Configuration (if using AWS)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# OTP Configuration (optional)
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

### Installing SMS Provider Packages

**For Twilio:**

```bash
cd backend
npm install twilio
```

**For AWS SNS:**

```bash
cd backend
npm install aws-sdk
```

## API Endpoints

### Send OTP

**POST** `/api/phone-verification/send`

**Request Body:**

```json
{
  "phone": "9812345678",
  "purpose": "registration", // or "update_phone"
  "userId": "optional_user_id" // for update_phone purpose
}
```

**Response:**

```json
{
  "message": "OTP sent successfully",
  "phone": "+9779812345678",
  "expiresIn": 600
}
```

**Error Responses:**

- `400` - Invalid request (missing fields, phone already registered)
- `429` - Rate limit (must wait before resending)

### Verify OTP

**POST** `/api/phone-verification/verify`

**Request Body:**

```json
{
  "phone": "9812345678",
  "otp": "123456",
  "purpose": "registration",
  "userId": "optional_user_id"
}
```

**Response:**

```json
{
  "message": "Phone number verified successfully",
  "phone": "+9779812345678",
  "verified": true
}
```

**Error Responses:**

- `400` - Invalid or expired OTP
- `429` - Too many failed attempts

### Check Verification Status

**GET** `/api/phone-verification/status?phone=9812345678&purpose=registration`

**Response:**

```json
{
  "verified": true,
  "phone": "+9779812345678"
}
```

## Security Features

1. **OTP Expiry**: OTPs expire after 10 minutes
2. **Attempt Limiting**: Maximum 5 verification attempts per OTP
3. **Rate Limiting**: 60-second cooldown between OTP resends
4. **Phone Formatting**: All phones normalized to E.164 format
5. **Verification Expiry**: Verifications must be used within 30 minutes
6. **Duplicate Prevention**: Prevents registration with already registered phones

## Phone Number Format

The system automatically formats phone numbers to E.164 format:

- Input: `9812345678` → Output: `+9779812345678`
- Input: `+9779812345678` → Output: `+9779812345678`
- Input: `009779812345678` → Output: `+9779812345678`

For Nepal, the country code `+977` is automatically prepended if not present.

## Testing in Development

In development mode (`SMS_PROVIDER=console`), OTPs are logged to the console instead of being sent via SMS:

```
📱 SMS OTP for +9779812345678: 123456
   (In production, this would be sent via Twilio)
```

## Production Setup

### Using Twilio

1. Sign up for Twilio account: https://www.twilio.com
2. Get your Account SID and Auth Token
3. Purchase a phone number or use trial number
4. Add to `.env`:
   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Using AWS SNS

1. Create AWS account and IAM user with SNS permissions
2. Get Access Key ID and Secret Access Key
3. Add to `.env`:
   ```env
   SMS_PROVIDER=aws
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

## Frontend Usage

### Registration Flow

```javascript
// In RegisterScreen.js
const response = await authService.register(email, password, name, phone, role);
// Returns: { tempRegistrationId, phone }

router.push({
  pathname: "/phone-verification",
  params: {
    phone: response.phone,
    purpose: "registration",
    tempRegistrationId: response.tempRegistrationId,
  },
});
```

### Phone Update Flow

```javascript
// In ProfileScreen.js
if (phoneChanged) {
  router.push({
    pathname: "/phone-verification",
    params: {
      phone: newPhone,
      purpose: "update_phone",
      userId: user.id,
      firstName: firstName,
      lastName: lastName,
    },
  });
}
```

## Error Handling

The system handles various error scenarios:

- **Invalid OTP**: Shows error with remaining attempts
- **Expired OTP**: Prompts user to request new OTP
- **Rate Limited**: Shows cooldown timer
- **Phone Already Registered**: Prevents duplicate registrations
- **Network Errors**: Shows user-friendly error messages

## Database Schema

### PhoneVerification Collection

```javascript
{
  phone: String,           // E.164 format
  otp: String,             // 6-digit code
  userId: ObjectId,        // Optional - for update_phone
  purpose: String,         // 'registration' or 'update_phone'
  verified: Boolean,       // Verification status
  expiresAt: Date,         // Auto-delete after expiry
  attempts: Number,         // Verification attempts (max 5)
  createdAt: Date
}
```

## Troubleshooting

### OTP Not Received

1. Check SMS provider configuration
2. Verify phone number format
3. Check console logs (development mode)
4. Check Twilio/AWS logs (production)

### Verification Fails

1. Check OTP expiry (10 minutes)
2. Check attempt limit (max 5)
3. Verify phone number matches exactly
4. Check database for verification record

### Registration Not Completing

1. Verify phone is verified before calling complete-registration
2. Check tempRegistrationId is valid
3. Verify verification is recent (within 30 minutes)

## Future Enhancements

- [ ] Support for international phone numbers
- [ ] Voice call OTP fallback
- [ ] OTP retry with exponential backoff
- [ ] SMS delivery status tracking
- [ ] Multiple phone number support per user
- [ ] Phone number verification badge in profile






