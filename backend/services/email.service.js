const nodemailer = require("nodemailer");
const config = require("../config");

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For local development, you can use Gmail or a service like Mailtrap
  // For production, use a proper SMTP service like SendGrid, AWS SES, etc.

  // Option 1: Gmail (for testing - requires app password)
  if (config.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD, // Use App Password, not regular password
      },
    });
  }

  // Option 2: SMTP (generic)
  if (config.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT || 587,
      secure: config.EMAIL_SECURE || false,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD,
      },
    });
  }

  // Option 3: Mailtrap (for development/testing)
  if (config.EMAIL_SERVICE === "mailtrap") {
    return nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD,
      },
    });
  }

  // Default: Console transporter (for development without email setup)
  // Return a mock transporter that logs to console
  return {
    sendMail: async (mailOptions) => {
      const resetUrlMatch = mailOptions.html.match(/href="([^"]+)"/);
      const resetUrl = resetUrlMatch ? resetUrlMatch[1] : "Not found";

      console.log("\n📧 ===== PASSWORD RESET EMAIL (Console Mode) =====");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("\n🔗 Reset URL:", resetUrl);
      console.log("==================================================\n");

      return {
        messageId: "console-mode-" + Date.now(),
        accepted: [mailOptions.to],
        response: "Email logged to console (console mode)",
      };
    },
  };
};

// Create transporter - will use console mode if no email config provided
const transporter = createTransporter();

const emailService = {
  /**
   * Send a password reset email. Supports either link-based or OTP-based flows.
   * Options:
   *  - { resetUrl } to send a clickable reset link
   *  - { otp } to send a one-time code (expires in 10 minutes)
   */
  sendPasswordResetEmail: async (email, { resetUrl, otp }) => {
    const isOtp = Boolean(otp);
    const subject = isOtp
      ? "Your Pathaideu verification code"
      : "Password Reset Request - Pathaideu";

    const htmlBody = isOtp
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1E3A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp { font-size: 32px; letter-spacing: 6px; font-weight: bold; color: #007AFF; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Pathaideu</h1>
            </div>
            <div class="content">
              <h2>Password Reset Verification</h2>
              <p>Hello,</p>
              <p>Use the one-time code below to reset your password. This code expires in 10 minutes.</p>
              <div class="otp">${otp}</div>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <p>Best regards,<br/>The Pathaideu Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1E3A5F;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #007AFF;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Pathaideu</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for your Pathaideu account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007AFF;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>Best regards,<br>The Pathaideu Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    const textBody = isOtp
      ? `
        Password Reset Verification - Pathaideu
        
        Your one-time code: ${otp}
        This code expires in 10 minutes.
        
        If you didn't request this, you can ignore this email.
      `
      : `
        Password Reset Request - Pathaideu
        
        We received a request to reset your password.
        
        Click this link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
      `;

    const mailOptions = {
      from: `"Pathaideu" <${config.EMAIL_FROM || config.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlBody,
      text: textBody,
    };

    try {
      const info = await transporter.sendMail(mailOptions);

      // Log success (console mode already logs above)
      if (config.EMAIL_SERVICE !== "console" && config.EMAIL_USER) {
        console.log(
          "📧 Password reset email sent successfully:",
          info.messageId
        );
      }

      return info;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      // In console mode, this shouldn't happen, but handle gracefully
      if (config.EMAIL_SERVICE === "console" || !config.EMAIL_USER) {
        if (isOtp) {
          console.log("\n📧 Password Reset OTP (fallback):", otp);
        } else {
          console.log("\n📧 Password Reset URL (fallback):", resetUrl);
        }
        return { messageId: "console-fallback", accepted: [email] };
      }
      throw new Error("Failed to send email: " + error.message);
    }
  },

  /**
   * Send delivery verification OTP to sender's email
   */
  sendDeliveryOTP: async (email, otp, packageCode) => {
    const subject = "Package Delivery Verification - Pathaideu";

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E3A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp { font-size: 32px; letter-spacing: 6px; font-weight: bold; color: #007AFF; text-align: center; margin: 20px 0; padding: 20px; background-color: white; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .info-box { background-color: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Pathaideu</h1>
          </div>
          <div class="content">
            <h2>Package Delivery Verification</h2>
            <p>Hello,</p>
            <p>Your package <strong>${packageCode}</strong> has been marked as delivered by the traveller.</p>
            <p>To verify and confirm the delivery, please use the verification code below:</p>
            <div class="otp">${otp}</div>
            <div class="info-box">
              <p><strong>⚠️ Important:</strong></p>
              <p>This code will expire in 10 minutes. Please verify the delivery in your app to complete the process.</p>
            </div>
            <p>If you did not receive this package or have any concerns, please contact support immediately.</p>
            <p>Best regards,<br>The Pathaideu Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Package Delivery Verification - Pathaideu

      Hello,

      Your package ${packageCode} has been marked as delivered by the traveller.

      Verification Code: ${otp}

      This code will expire in 10 minutes. Please verify the delivery in your app to complete the process.

      If you did not receive this package or have any concerns, please contact support immediately.

      Best regards,
      The Pathaideu Team
    `;

    try {
      const mailOptions = {
        from: `"Pathaideu" <${config.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: htmlBody,
        text: textBody,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Delivery OTP email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("❌ Error sending delivery OTP email:", error);
      throw error;
    }
  },

  /**
   * Send address verification email
   */
  sendAddressVerificationEmail: async (email, verificationCode, isUpdate = false) => {
    const subject = isUpdate 
      ? "Address Update Verification - Pathaideu"
      : "Address Verification - Pathaideu";

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E3A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { font-size: 32px; letter-spacing: 6px; font-weight: bold; color: #007AFF; text-align: center; margin: 20px 0; padding: 20px; background-color: white; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .info-box { background-color: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Pathaideu</h1>
          </div>
          <div class="content">
            <h2>${isUpdate ? 'Address Update' : 'Address'} Verification</h2>
            <p>Hello,</p>
            <p>You have ${isUpdate ? 'updated' : 'added'} a permanent address to your Pathaideu account.</p>
            <p>To verify and confirm this address, please use the verification code below:</p>
            <div class="code">${verificationCode}</div>
            <div class="info-box">
              <p><strong>⚠️ Important:</strong></p>
              <p>This code will expire in 10 minutes. Please verify the address in your app to complete the process.</p>
            </div>
            <p>If you did not ${isUpdate ? 'update' : 'add'} this address, please contact support immediately.</p>
            <p>Best regards,<br>The Pathaideu Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      ${isUpdate ? 'Address Update' : 'Address'} Verification - Pathaideu

      Hello,

      You have ${isUpdate ? 'updated' : 'added'} a permanent address to your Pathaideu account.

      Verification Code: ${verificationCode}

      This code will expire in 10 minutes. Please verify the address in your app to complete the process.

      If you did not ${isUpdate ? 'update' : 'add'} this address, please contact support immediately.

      Best regards,
      The Pathaideu Team
    `;

    try {
      const mailOptions = {
        from: `"Pathaideu" <${config.EMAIL_FROM || config.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: htmlBody,
        text: textBody,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Address verification email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error("❌ Error sending address verification email:", error);
      throw error;
    }
  },
};

module.exports = emailService;
