// SMS Service for sending OTP via SMS
// Supports multiple providers: Twilio, AWS SNS, or console (for development)

const config = require('../config');

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +9779812345678)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Returns true if SMS sent successfully
 */
async function sendOTP(phoneNumber, otp) {
  const smsProvider = config.SMS_PROVIDER || 'console';

  try {
    switch (smsProvider) {
      case 'twilio':
        return await sendViaTwilio(phoneNumber, otp);
      
      case 'aws':
        return await sendViaAWS(phoneNumber, otp);
      
      case 'console':
      default:
        // For development - just log to console
        console.log(`📱 SMS OTP for ${phoneNumber}: ${otp}`);
        console.log(`   (In production, this would be sent via ${config.SMS_PROVIDER || 'Twilio'})`);
        return true;
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    throw new Error('Failed to send SMS. Please try again.');
  }
}

/**
 * Send OTP via Twilio
 */
async function sendViaTwilio(phoneNumber, otp) {
  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN || !config.TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio credentials not configured. Please check your .env file.');
  }

  const twilio = require('twilio');
  const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

  try {
    const message = await client.messages.create({
      body: `Your Pathaideu verification code is: ${otp}. This code expires in 10 minutes.`,
      from: config.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`✅ SMS sent via Twilio. SID: ${message.sid}, Status: ${message.status}`);
    return true;
  } catch (error) {
    console.error('❌ Twilio Error:', error.message);
    
    // Provide helpful error messages
    if (error.code === 21211) {
      throw new Error('Invalid phone number format. Please use E.164 format (e.g., +9779812345678)');
    } else if (error.code === 21608) {
      throw new Error('Trial account can only send to verified phone numbers. Please verify the number in Twilio Console or upgrade your account.');
    } else if (error.code === 20003) {
      throw new Error('Invalid Twilio credentials. Please check your Account SID and Auth Token.');
    } else if (error.code === 21214) {
      throw new Error('Invalid Twilio phone number. Please check your TWILIO_PHONE_NUMBER in .env file.');
    }
    
    throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
  }
}

/**
 * Send OTP via AWS SNS
 */
async function sendViaAWS(phoneNumber, otp) {
  const AWS = require('aws-sdk');
  
  // Configure AWS SNS
  const sns = new AWS.SNS({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.AWS_REGION || 'us-east-1'
  });

  const params = {
    Message: `Your Pathaideu verification code is: ${otp}. This code expires in 10 minutes.`,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional' // For OTP/verification messages
      }
    }
  };

  try {
    const result = await sns.publish(params).promise();
    console.log(`✅ SMS sent via AWS SNS. MessageId: ${result.MessageId}`);
    return true;
  } catch (error) {
    console.error('❌ AWS SNS Error:', error);
    throw new Error(`Failed to send SMS via AWS SNS: ${error.message}`);
  }
}

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number (can be in various formats)
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If phone doesn't start with country code, assume Nepal (+977)
  if (!cleaned.startsWith('977')) {
    cleaned = '977' + cleaned;
  }
  
  // Add + prefix
  return '+' + cleaned;
}

module.exports = {
  generateOTP,
  sendOTP,
  formatPhoneNumber
};

