const express = require('express');
const PhoneVerification = require('../models/phoneVerification.model');
const User = require('../models/user.model');
const { authenticate } = require('../middleware/auth');
const smsService = require('../services/sms.service');
const config = require('../config');

const router = express.Router();

/**
 * Send OTP to phone number
 * POST /api/phone-verification/send
 * Body: { phone: string, purpose: 'registration' | 'update_phone', userId?: string }
 */
router.post('/send', async (req, res) => {
  try {
    const { phone, purpose, userId } = req.body;

    console.log('📤 Send OTP Request:', { phone, purpose, userId });

    if (!phone || !purpose) {
      return res.status(400).json({ error: 'Phone number and purpose are required' });
    }

    if (!['registration', 'update_phone'].includes(purpose)) {
      return res.status(400).json({ error: 'Invalid purpose. Must be "registration" or "update_phone"' });
    }

    // Format phone number to E.164 format
    const formattedPhone = smsService.formatPhoneNumber(phone);
    console.log('📱 Formatted phone (send):', formattedPhone);

    // Check if phone is already registered (for registration purpose)
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ phone: formattedPhone });
      if (existingUser) {
        return res.status(400).json({ error: 'Phone number is already registered' });
      }
    }

    // Check for existing unverified OTP for this phone
    const existingVerification = await PhoneVerification.findOne({
      phone: formattedPhone,
      purpose,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    let verification;

    if (existingVerification) {
      // Check if we can resend (rate limiting: max 1 resend per minute)
      const timeSinceCreation = Date.now() - existingVerification.createdAt.getTime();
      if (timeSinceCreation < 60000) { // 1 minute
        return res.status(429).json({ 
          error: 'Please wait before requesting a new OTP. You can resend in ' + 
                 Math.ceil((60000 - timeSinceCreation) / 1000) + ' seconds.' 
        });
      }

      // Update existing verification with new OTP
      const newOTP = smsService.generateOTP();
      existingVerification.otp = newOTP;
      existingVerification.expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);
      existingVerification.attempts = 0; // Reset attempts on resend
      existingVerification.userId = userId || null;
      verification = await existingVerification.save();
    } else {
      // Create new verification
      const otp = smsService.generateOTP();
      verification = new PhoneVerification({
        phone: formattedPhone,
        otp,
        purpose,
        userId: userId || null,
        expiresAt: new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000)
      });
      await verification.save();
    }

    // Send OTP via SMS
    await smsService.sendOTP(formattedPhone, verification.otp);

    res.json({ 
      message: 'OTP sent successfully',
      phone: formattedPhone, // Return formatted phone for frontend
      expiresIn: config.OTP_EXPIRY_MINUTES * 60 // seconds
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

/**
 * Verify OTP
 * POST /api/phone-verification/verify
 * Body: { phone: string, otp: string, purpose: 'registration' | 'update_phone', userId?: string }
 */
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp, purpose, userId } = req.body;

    console.log('🔍 OTP Verification Request:', { phone, otp: otp ? '***' : 'missing', purpose, userId });

    if (!phone || !otp || !purpose) {
      console.log('❌ Missing required fields:', { phone: !!phone, otp: !!otp, purpose: !!purpose });
      return res.status(400).json({ error: 'Phone number, OTP, and purpose are required' });
    }

    const formattedPhone = smsService.formatPhoneNumber(phone);
    console.log('📱 Formatted phone:', formattedPhone);

    // Find verification record - try multiple queries to debug
    const now = new Date();
    console.log('🔍 Searching for verification:', { 
      phone: formattedPhone, 
      purpose, 
      currentTime: now,
      lookingFor: { verified: false, expiresAt: { $gt: now } }
    });

    // First, check all unverified records for this phone and purpose
    const allUnverified = await PhoneVerification.find({
      phone: formattedPhone,
      purpose,
      verified: false
    }).sort({ createdAt: -1 });
    
    console.log('📋 All unverified records found:', allUnverified.length);
    if (allUnverified.length > 0) {
      allUnverified.forEach((v, i) => {
        console.log(`   Record ${i + 1}:`, {
          otp: v.otp,
          expiresAt: v.expiresAt,
          isExpired: v.expiresAt < now,
          attempts: v.attempts
        });
      });
    }

    // Find non-expired verification record
    const verification = await PhoneVerification.findOne({
      phone: formattedPhone,
      purpose,
      verified: false,
      expiresAt: { $gt: now }
    }).sort({ createdAt: -1 }); // Get most recent

    console.log('🔍 Non-expired verification record found:', verification ? 'Yes' : 'No');
    
    if (!verification) {
      // Check if there's an expired verification
      if (allUnverified.length > 0) {
        const expiredVerification = allUnverified[0];
        console.log('⏰ OTP expired at:', expiredVerification.expiresAt, 'Current time:', now);
        const minutesExpired = Math.floor((now - expiredVerification.expiresAt) / 60000);
        return res.status(400).json({ 
          error: `OTP has expired ${minutesExpired} minute(s) ago. Please request a new one.` 
        });
      }
      
      // Check if phone format might be different
      const anyVerification = await PhoneVerification.findOne({
        purpose,
        verified: false
      }).sort({ createdAt: -1 });
      
      if (anyVerification) {
        console.log('⚠️  Found verification with different phone:', {
          stored: anyVerification.phone,
          lookingFor: formattedPhone,
          match: anyVerification.phone === formattedPhone
        });
      }
      
      console.log('❌ No verification record found for:', { phone: formattedPhone, purpose });
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Check attempts
    if (verification.attempts >= 5) {
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    console.log('🔐 Verifying OTP:', { stored: verification.otp, received: otp, match: verification.otp === otp });
    
    if (verification.otp !== otp) {
      verification.attempts += 1;
      await verification.save();
      
      const remainingAttempts = 5 - verification.attempts;
      console.log('❌ Invalid OTP. Attempts:', verification.attempts, 'Remaining:', remainingAttempts);
      return res.status(400).json({ 
        error: 'Invalid OTP. ' + 
               (remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.')
      });
    }

    // Mark as verified
    verification.verified = true;
    verification.userId = userId || null; // Store userId if provided
    await verification.save();

    console.log('✅ OTP verified successfully. Verification record updated:', {
      phone: formattedPhone,
      purpose,
      verified: true,
      userId: verification.userId
    });

    res.json({ 
      message: 'Phone number verified successfully',
      phone: formattedPhone,
      verified: true
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

/**
 * Check verification status
 * GET /api/phone-verification/status
 * Query: { phone: string, purpose: string }
 */
router.get('/status', async (req, res) => {
  try {
    const { phone, purpose } = req.query;

    if (!phone || !purpose) {
      return res.status(400).json({ error: 'Phone number and purpose are required' });
    }

    const formattedPhone = smsService.formatPhoneNumber(phone);

    const verification = await PhoneVerification.findOne({
      phone: formattedPhone,
      purpose,
      verified: true
    }).sort({ createdAt: -1 });

    res.json({ 
      verified: !!verification,
      phone: formattedPhone
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ error: error.message || 'Failed to check verification status' });
  }
});

module.exports = router;

