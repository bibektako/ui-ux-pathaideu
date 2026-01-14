# Pathaideu Backend

Local-only peer-to-peer package delivery system backend.

## Prerequisites

- Node.js (v16+)
- MongoDB Community Edition running on `localhost:27017`

## Installation

```bash
npm install
```

## Configuration

Edit `config.js` to customize:
- MongoDB connection string
- JWT secret
- Upload directories
- Matching thresholds

## Running

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://0.0.0.0:3000` (accessible via LAN IP for mobile devices).

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/pending-verifications` - Get pending verifications
- `POST /api/admin/verify-user/:userId` - Verify/reject user
- `POST /api/admin/release-transaction/:txId` - Release escrow
- `POST /api/admin/refund-transaction/:txId` - Refund escrow
- `GET /api/admin/reports` - Get system reports

### Trips
- `POST /api/trips` - Create trip
- `GET /api/trips` - List trips
- `GET /api/trips/:id` - Get trip details
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Cancel trip

### Packages
- `POST /api/packages` - Create package
- `GET /api/packages` - List packages
- `GET /api/packages/:id` - Get package details
- `GET /api/packages/code/:code` - Track package by code
- `GET /api/packages/:id/matches` - Find matching trips
- `POST /api/packages/:id/accept` - Accept package
- `POST /api/packages/:id/pickup` - Mark picked up
- `POST /api/packages/:id/deliver` - Mark delivered
- `POST /api/packages/:id/dispute` - Raise dispute

### Tracking
- `POST /api/tracking/:id/location` - Update location
- `GET /api/tracking/:id/history` - Get tracking history

### Wallet
- `POST /api/wallet/topup` - Top up wallet
- `POST /api/wallet/hold` - Hold funds
- `POST /api/wallet/release` - Release funds
- `POST /api/wallet/refund` - Refund funds
- `GET /api/wallet/balance` - Get balance
- `GET /api/wallet/transactions` - Get transactions

### Submissions
- `POST /api/submissions` - Upload files (multipart/form-data)
- `GET /api/submissions` - List submissions
- `GET /api/submissions/:id` - Get submission details

## Database Collections

- `users` - User accounts
- `trips` - Traveller trips
- `packages` - Package listings
- `transactions` - Wallet transactions
- `submissions` - File submissions (IDs, photos, etc.)

## Storage

Uploaded files are stored in:
- `uploads/ids/` - ID verification images
- `uploads/package_photos/` - Package photos
- `uploads/traveller_photos/` - Traveller photos

## Notes

- All endpoints except `/api/auth/*` and `/api/packages/code/:code` require authentication
- Use JWT token in `Authorization: Bearer <token>` header
- Admin endpoints require `role: 'admin'`
- Verified endpoints require `verified: true` user flag




















