const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const tripsRoutes = require('./routes/trips');
const packagesRoutes = require('./routes/packages');
const trackingRoutes = require('./routes/tracking');
const submissionsRoutes = require('./routes/submissions');
const notificationsRoutes = require('./routes/notifications');
const adsRoutes = require('./routes/ads');
const phoneVerificationRoutes = require('./routes/phoneVerification');

const app = express();

// Ensure upload directories exist
Object.values(config.UPLOAD_DIR).forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/phone-verification', phoneVerificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;









