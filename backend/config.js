module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pathaideu',
  JWT_SECRET: process.env.JWT_SECRET || 'local-dev-secret-key-change-in-production',
  JWT_EXPIRES_IN: '14d',
  UPLOAD_DIR: {
    IDS: 'uploads/ids',
    PACKAGE_PHOTOS: 'uploads/package_photos',
    TRAVELLER_PHOTOS: 'uploads/traveller_photos',
    ADS: 'uploads/ads'
  },
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 10 * 1024 * 1024, // 10MB for videos
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_AD_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/quicktime'],
  MATCHING_DISTANCE_THRESHOLD: 50, // km
  MATCHING_DATE_WINDOW_DAYS: 3,
  // Email configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'console', // 'gmail', 'mailtrap', 'smtp', or 'console'
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  // Frontend URL for password reset links
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8081',
  // SMS Configuration
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'console', // 'twilio', 'aws', or 'console'
  // Twilio Configuration
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  // AWS SNS Configuration
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  // OTP Configuration
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH) || 6
};








