/**
 * Test script to verify Twilio SMS configuration
 * Run with: node test-twilio.js
 */

require('dotenv').config();
const config = require('./config');
const smsService = require('./services/sms.service');

async function testTwilio() {
  console.log('🧪 Testing Twilio SMS Configuration...\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`   SMS Provider: ${config.SMS_PROVIDER}`);
  console.log(`   Twilio Account SID: ${config.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twilio Auth Token: ${config.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twilio Phone Number: ${config.TWILIO_PHONE_NUMBER || '❌ Missing'}`);
  console.log('');

  if (config.SMS_PROVIDER !== 'twilio') {
    console.log('⚠️  Warning: SMS_PROVIDER is not set to "twilio"');
    console.log('   Set SMS_PROVIDER=twilio in your .env file\n');
  }

  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN || !config.TWILIO_PHONE_NUMBER) {
    console.log('❌ Missing Twilio credentials. Please check your .env file.');
    console.log('\nRequired environment variables:');
    console.log('  SMS_PROVIDER=twilio');
    console.log('  TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('  TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('  TWILIO_PHONE_NUMBER=+1234567890');
    process.exit(1);
  }

  // Test phone number (use your own for testing)
  const testPhone = process.argv[2] || '+9779812345678'; // Replace with your phone number
  
  console.log(`📱 Testing SMS to: ${testPhone}`);
  console.log('   (Note: On trial accounts, phone must be verified in Twilio Console)\n');

  try {
    const otp = smsService.generateOTP();
    console.log(`   Generated OTP: ${otp}`);
    console.log('   Sending SMS...\n');

    await smsService.sendOTP(testPhone, otp);
    
    console.log('✅ SMS sent successfully!');
    console.log(`   Check your phone (${testPhone}) for the OTP: ${otp}`);
    console.log('\n💡 Tip: If you didn\'t receive the SMS:');
    console.log('   1. Check if phone number is verified (for trial accounts)');
    console.log('   2. Check Twilio Console → Monitor → Logs for delivery status');
    console.log('   3. Verify phone number format is E.164 (+977XXXXXXXXX)');
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify all Twilio credentials in .env file');
    console.log('   2. Check Twilio Console for account status');
    console.log('   3. For trial accounts, verify the phone number in Twilio Console');
    console.log('   4. Check Twilio phone number format (must include + and country code)');
    process.exit(1);
  }
}

// Run test
testTwilio().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});







