require('dotenv').config();
const app = require('./app');
const connectDB = require('./db');
const config = require('./config');
const packageExpirationService = require('./services/packageExpiration.service');

const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${config.PORT}`);
      console.log(`📱 Use your LAN IP (e.g., http://192.168.x.x:${config.PORT}) for mobile access`);
    });

    // Start package expiration check scheduler
    // Run every hour to check for expired packages
    const EXPIRATION_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Run immediately on startup, then every hour
    packageExpirationService.checkAndExpirePackages().catch(err => {
      console.error('❌ Error in initial package expiration check:', err);
    });

    setInterval(() => {
      packageExpirationService.checkAndExpirePackages().catch(err => {
        console.error('❌ Error in scheduled package expiration check:', err);
      });
    }, EXPIRATION_CHECK_INTERVAL);

    console.log('⏰ Package expiration scheduler started (runs every hour)');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();











