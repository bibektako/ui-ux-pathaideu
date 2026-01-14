# SMS Verification Setup Guide

## Quick Comparison: Twilio vs AWS SNS

### Twilio
- ✅ Easy setup and excellent documentation
- ✅ Free trial with credits
- ❌ Can only send to verified numbers during trial
- ❌ ~$0.0083 per SMS after trial
- ❌ Need to upgrade for production

### AWS SNS (Recommended for Free Tier)
- ✅ **100 free SMS per month** (ongoing, not just trial)
- ✅ Lower cost per SMS (~$0.00645)
- ✅ 1 million requests/month free
- ✅ No trial restrictions
- ❌ Slightly more complex setup

## Recommendation: AWS SNS

**For your use case (Nepal-based app):**
- AWS SNS provides **100 free SMS per month** permanently
- Lower cost per SMS after free tier
- Better for development and small-scale production
- Nepal SMS pricing: ~$0.00645 - $0.008 per SMS

## Setup Instructions

### Option 1: AWS SNS (Recommended)

#### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Sign up for free account (requires credit card, but won't charge for free tier)
3. Complete account verification

#### Step 2: Create IAM User for SNS
1. Go to AWS Console → IAM (Identity and Access Management)
2. Click "Users" → "Add users"
3. Username: `pathaideu-sns-user`
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select: `AmazonSNSFullAccess` (or create custom policy with SNS publish permission)
8. Click "Next" → "Create user"
9. **IMPORTANT**: Save the Access Key ID and Secret Access Key (shown only once)

#### Step 3: Configure Backend
1. Add to `backend/.env`:
```env
SMS_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=ap-south-1
```

**Note:** Use `ap-south-1` (Mumbai) region for Nepal - it's closest and may have better pricing.

#### Step 4: Install Package
```bash
cd backend
npm install aws-sdk
```

#### Step 5: Test
1. Start your backend server
2. Try registering a new user
3. Check AWS SNS console → Text messaging (SMS) → Delivery logs
4. First 100 SMS per month are free!

### Option 2: Twilio (Alternative)

#### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up for free trial
3. Verify your email and phone number

#### Step 2: Get Credentials
1. Go to Twilio Console Dashboard
2. Copy your:
   - Account SID
   - Auth Token
   - Trial Phone Number (or purchase a number)

#### Step 3: Configure Backend
1. Add to `backend/.env`:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### Step 4: Install Package
```bash
cd backend
npm install twilio
```

#### Step 5: Verify Phone Numbers (Trial Limitation)
- During trial, you can only send SMS to verified phone numbers
- Go to Twilio Console → Phone Numbers → Verified Caller IDs
- Add phone numbers you want to test with

## Cost Comparison for Nepal

### AWS SNS
- **Free:** 100 SMS/month
- **After free tier:** ~$0.00645 - $0.008 per SMS
- **Example:** 500 SMS/month = $0 (first 100) + $2.58 (400 × $0.00645) = **$2.58/month**

### Twilio
- **Free:** Trial credits only
- **After trial:** ~$0.0083 per SMS
- **Example:** 500 SMS/month = 500 × $0.0083 = **$4.15/month**

## Development Mode (No Setup Required)

For development/testing, you can use console mode (no SMS provider needed):

```env
SMS_PROVIDER=console
```

OTPs will be logged to console:
```
📱 SMS OTP for +9779812345678: 123456
```

## Testing Your Setup

### Test SMS Sending
```bash
# Start backend
cd backend
npm start

# In another terminal, test the endpoint
curl -X POST http://localhost:3000/api/phone-verification/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9812345678",
    "purpose": "registration"
  }'
```

### Check AWS SNS Delivery
1. Go to AWS Console → SNS → Text messaging (SMS)
2. Click "Delivery logs" to see sent messages
3. Check delivery status and any errors

### Check Twilio Logs
1. Go to Twilio Console → Monitor → Logs → Messaging
2. View sent messages and delivery status

## Troubleshooting

### AWS SNS Issues

**Error: "InvalidParameterException"**
- Check phone number format (must be E.164: +9779812345678)
- Verify AWS credentials are correct

**Error: "AccessDenied"**
- Check IAM user has SNS publish permissions
- Verify Access Key ID and Secret Access Key

**SMS Not Delivered**
- Check AWS SNS delivery logs
- Verify phone number is valid
- Some countries may have restrictions

### Twilio Issues

**Error: "Trial account can only send to verified numbers"**
- Add phone number to verified list in Twilio Console
- Or upgrade to paid account

**Error: "Invalid phone number"**
- Ensure phone number is in E.164 format
- Check Twilio supports your country

## Production Recommendations

1. **Start with AWS SNS** - Better free tier for development
2. **Monitor usage** - Set up AWS CloudWatch alarms for SMS spending
3. **Consider Twilio** - If you need more features (WhatsApp, MMS, etc.)
4. **Use both** - Can switch providers via environment variable

## Security Best Practices

1. **Never commit credentials** - Keep `.env` in `.gitignore`
2. **Use IAM roles** - In production, use AWS IAM roles instead of access keys
3. **Set spending limits** - Configure AWS billing alerts
4. **Rotate credentials** - Regularly update access keys

## Next Steps

1. Choose your provider (AWS SNS recommended)
2. Set up account and get credentials
3. Add credentials to `backend/.env`
4. Install required package
5. Test with a real phone number
6. Monitor usage and costs

For questions or issues, refer to:
- AWS SNS Docs: https://docs.aws.amazon.com/sns/
- Twilio Docs: https://www.twilio.com/docs







