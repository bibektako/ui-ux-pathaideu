const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const PasswordReset = require("../models/passwordReset.model");
const config = require("../config");
const { authenticate } = require("../middleware/auth");
const emailService = require("../services/email.service");
const notificationService = require("../services/notification.service");

const router = express.Router();

// Temporary registration data storage (in production, use Redis or similar)
const tempRegistrations = new Map();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // All fields including phone are required
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Format phone number
    const smsService = require('../services/sms.service');
    const formattedPhone = smsService.formatPhoneNumber(phone);

    // Check if phone is already registered
    const existingPhoneUser = await User.findOne({ phone: formattedPhone });
    if (existingPhoneUser) {
      return res.status(400).json({ error: "Phone number is already registered" });
    }

    // Store registration data temporarily (expires in 30 minutes)
    const tempId = require('crypto').randomBytes(16).toString('hex');
    tempRegistrations.set(tempId, {
      email,
      password,
      name,
      phone: formattedPhone,
      role: role || "sender",
      createdAt: Date.now()
    });

    // Clean up expired registrations (older than 30 minutes)
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    for (const [key, value] of tempRegistrations.entries()) {
      if (value.createdAt < thirtyMinutesAgo) {
        tempRegistrations.delete(key);
      }
    }

    res.status(200).json({
      message: "Registration data saved. Please verify your phone number.",
      tempRegistrationId: tempId,
      phone: formattedPhone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete registration after phone verification
router.post("/complete-registration", async (req, res) => {
  try {
    const { tempRegistrationId } = req.body;

    if (!tempRegistrationId) {
      return res.status(400).json({ error: "Registration ID is required" });
    }

    const tempData = tempRegistrations.get(tempRegistrationId);
    if (!tempData) {
      return res.status(400).json({ error: "Invalid or expired registration. Please register again." });
    }

    // Check if phone is verified
    const PhoneVerification = require('../models/phoneVerification.model');
    
    console.log('🔍 Checking phone verification for registration:', {
      phone: tempData.phone,
      purpose: 'registration'
    });
    
    // First check for verified record
    let verification = await PhoneVerification.findOne({
      phone: tempData.phone,
      purpose: 'registration',
      verified: true
    }).sort({ createdAt: -1 });

    // If not found, check all records for this phone (for debugging)
    if (!verification) {
      const allRecords = await PhoneVerification.find({
        phone: tempData.phone,
        purpose: 'registration'
      }).sort({ createdAt: -1 });
      
      console.log('📋 All verification records for this phone:', allRecords.length);
      allRecords.forEach((r, i) => {
        console.log(`   Record ${i + 1}:`, {
          verified: r.verified,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt
        });
      });
      
      return res.status(400).json({ error: "Phone number not verified. Please verify your phone number first." });
    }
    
    console.log('✅ Found verified record:', {
      verified: verification.verified,
      createdAt: verification.createdAt
    });

    // Check if verification is recent (within last 30 minutes)
    const verificationAge = Date.now() - verification.createdAt.getTime();
    if (verificationAge > 30 * 60 * 1000) {
      return res.status(400).json({ error: "Verification expired. Please verify your phone number again." });
    }

    // Create user
    const user = new User({
      email: tempData.email,
      password: tempData.password,
      name: tempData.name,
      phone: tempData.phone,
      role: tempData.role,
    });

    await user.save();

    // Clean up temp registration
    tempRegistrations.delete(tempRegistrationId);

    // Mark verification as used (optional - for tracking)
    verification.userId = user._id;
    await verification.save();

    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        permanentAddress: user.permanentAddress || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/me", authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) {
      user.name = name;
    }
    if (phone) {
      // Check if phone number is being changed
      const smsService = require('../services/sms.service');
      const formattedPhone = smsService.formatPhoneNumber(phone);
      
      if (formattedPhone !== user.phone) {
        // Phone number is being changed - require verification
        const PhoneVerification = require('../models/phoneVerification.model');
        const verification = await PhoneVerification.findOne({
          phone: formattedPhone,
          purpose: 'update_phone',
          verified: true,
          userId: user._id
        }).sort({ createdAt: -1 });

        if (!verification) {
          return res.status(400).json({ 
            error: "Phone number not verified. Please verify your phone number first." 
          });
        }

        // Check if verification is recent (within last 30 minutes)
        const verificationAge = Date.now() - verification.createdAt.getTime();
        if (verificationAge > 30 * 60 * 1000) {
          return res.status(400).json({ 
            error: "Verification expired. Please verify your phone number again." 
          });
        }

        // Check if new phone is already registered to another user
        const existingUser = await User.findOne({ 
          phone: formattedPhone,
          _id: { $ne: user._id }
        });
        if (existingUser) {
          return res.status(400).json({ error: "Phone number is already registered" });
        }

        user.phone = formattedPhone;
      }
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
      },
    });

    await notificationService.create(
      user._id,
      "Profile updated",
      "Your profile information was updated.",
      "profile_update",
      { fields: { name: Boolean(name), phone: Boolean(phone) } }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Send OTP to email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Delete any existing reset tokens for this user
      await PasswordReset.deleteMany({ userId: user._id, used: false });

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const resetToken = new PasswordReset({
        userId: user._id,
        token: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      await resetToken.save();

      // Send OTP email
      try {
        await emailService.sendPasswordResetEmail(user.email, { otp });
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Still return success to user, but log the error
      }
    }

    // Always return success message (security best practice)
    res.json({
      message:
        "If an account with that email exists, we have sent a verification code.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ error: "An error occurred. Please try again later." });
  }
});

// Reset Password - Verify OTP and change password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Find the OTP token
    const resetToken = await PasswordReset.findOne({
      userId: user._id,
      token: otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    res.json({
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ error: "An error occurred. Please try again later." });
  }
});

// Temporary address verification storage (in production, use Redis or similar)
const tempAddressVerifications = new Map();

// Update or add permanent address - sends verification email
router.put("/address", authenticate, async (req, res) => {
  try {
    const { city, address, coordinates } = req.body;

    if (!city || !address || !coordinates || !coordinates.lat || !coordinates.lng) {
      return res.status(400).json({ 
        error: "City, address, and coordinates (lat, lng) are required" 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isUpdate = user.permanentAddress && user.permanentAddress.city;

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification temporarily (expires in 10 minutes)
    const verificationId = require('crypto').randomBytes(16).toString('hex');
    tempAddressVerifications.set(verificationId, {
      userId: user._id,
      city,
      address,
      coordinates,
      verificationCode,
      createdAt: Date.now()
    });

    // Clean up expired verifications (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of tempAddressVerifications.entries()) {
      if (value.createdAt < tenMinutesAgo) {
        tempAddressVerifications.delete(key);
      }
    }

    // Send verification email
    try {
      await emailService.sendAddressVerificationEmail(
        user.email, 
        verificationCode, 
        isUpdate
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Still return success, but log the error
    }

    res.json({
      message: `Verification code sent to ${user.email}. Please verify to ${isUpdate ? 'update' : 'add'} your address.`,
      verificationId
    });
  } catch (error) {
    console.error("Address update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify address with code
router.post("/address/verify", authenticate, async (req, res) => {
  try {
    const { verificationId, verificationCode } = req.body;

    if (!verificationId || !verificationCode) {
      return res.status(400).json({ 
        error: "Verification ID and code are required" 
      });
    }

    const verification = tempAddressVerifications.get(verificationId);
    if (!verification) {
      return res.status(400).json({ 
        error: "Invalid or expired verification. Please try again." 
      });
    }

    // Check if verification is expired (10 minutes)
    const verificationAge = Date.now() - verification.createdAt;
    if (verificationAge > 10 * 60 * 1000) {
      tempAddressVerifications.delete(verificationId);
      return res.status(400).json({ 
        error: "Verification expired. Please try again." 
      });
    }

    // Verify user matches
    if (verification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: "Unauthorized" 
      });
    }

    // Verify code matches
    if (verification.verificationCode !== verificationCode) {
      return res.status(400).json({ 
        error: "Invalid verification code" 
      });
    }

    // Update user address
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isUpdate = user.permanentAddress && user.permanentAddress.city;

    user.permanentAddress = {
      city: verification.city,
      address: verification.address,
      coordinates: {
        lat: verification.coordinates.lat,
        lng: verification.coordinates.lng
      },
      verified: true,
      updatedAt: new Date()
    };

    await user.save();

    // Clean up verification
    tempAddressVerifications.delete(verificationId);

    // Send notification
    await notificationService.create(
      user._id,
      isUpdate ? "Address updated" : "Address added",
      `Your permanent address has been ${isUpdate ? 'updated' : 'added'} successfully.`,
      "address_update",
      { 
        city: verification.city,
        address: verification.address
      }
    );

    res.json({
      message: `Address ${isUpdate ? 'updated' : 'added'} successfully.`,
      address: user.permanentAddress
    });
  } catch (error) {
    console.error("Address verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get current address
router.get("/address", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("permanentAddress");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      address: user.permanentAddress || null
    });
  } catch (error) {
    console.error("Get address error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
