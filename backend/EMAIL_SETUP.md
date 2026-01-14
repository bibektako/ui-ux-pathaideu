# Email Configuration Guide

The password reset feature uses nodemailer to send emails. For local development, you have several options:

## Option 1: Console Mode (Default - No Setup Required)

By default, the system runs in console mode, which logs the reset link to the console instead of sending an email. This is perfect for local development.

**No configuration needed!** Just check your backend console when testing password reset.

## Option 2: Gmail (For Testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate a new app password for "Mail"
3. Set environment variables:
   ```bash
   export EMAIL_SERVICE=gmail
   export EMAIL_USER=your-email@gmail.com
   export EMAIL_PASSWORD=your-app-password
   export EMAIL_FROM=your-email@gmail.com
   ```

## Option 3: Mailtrap (Recommended for Development)

1. Sign up for a free account at https://mailtrap.io
2. Get your SMTP credentials from the inbox
3. Set environment variables:
   ```bash
   export EMAIL_SERVICE=mailtrap
   export EMAIL_USER=your-mailtrap-username
   export EMAIL_PASSWORD=your-mailtrap-password
   ```

## Option 4: Custom SMTP Server

Set environment variables:
```bash
export EMAIL_SERVICE=smtp
export EMAIL_HOST=smtp.your-provider.com
export EMAIL_PORT=587
export EMAIL_SECURE=false
export EMAIL_USER=your-email@domain.com
export EMAIL_PASSWORD=your-password
export EMAIL_FROM=your-email@domain.com
```

## Frontend URL Configuration

Set the frontend URL for password reset links:
```bash
export FRONTEND_URL=http://localhost:8081
# Or for physical device:
export FRONTEND_URL=http://192.168.x.x:8081
```

## Testing

1. Start the backend server
2. Request a password reset from the mobile app
3. Check:
   - Console mode: Backend console for the reset link
   - Email mode: Your email inbox or Mailtrap inbox
4. Click the reset link or copy the token from console
5. Enter new password in the reset password screen

## Notes

- Reset tokens expire after 1 hour
- Each token can only be used once
- The system always returns success (even if email doesn't exist) to prevent email enumeration attacks













