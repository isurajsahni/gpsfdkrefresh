/**
 * Email Verification Template
 * Sent when a new user signs up and needs to verify their email address.
 * Uses a friendly onboarding tone with a small welcome message.
 */

const { baseLayout, BRAND_COLOR } = require('./baseLayout');

const SUBJECT = 'Verify Your Email Address - GPSFDK';

const emailVerificationEmail = (userName, otp) => {
  const greeting = userName && userName !== 'there' ? userName : 'there';

  const content = `
    <div style="font-size: 48px; margin-bottom: 16px;">📩</div>
    <h2 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 700;">
      Confirm Your Email
    </h2>
    <p style="color: #555; margin: 16px 0 0; font-size: 15px; line-height: 1.7;">
      Hi ${greeting},<br>
      Welcome to GPSFDK! We just need to verify your email address to get you started. Enter the code below to complete your registration.
    </p>

    <!-- OTP Box -->
    <div class="otp-container">
      <h1 class="otp-code">${otp}</h1>
    </div>

    <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 0;">
      This code is valid for <strong style="color: #555;">10 minutes</strong>.
    </p>

    <!-- Welcome note -->
    <div style="margin-top: 28px; padding: 16px 20px; background: #f0faf4; border-radius: 10px; border-left: 4px solid ${BRAND_COLOR};">
      <p style="margin: 0; font-size: 13px; color: #065F46; line-height: 1.5;">
        🎨 <strong>You're almost there!</strong> Once verified, you'll get access to our premium collection of wall art, custom nameplates, and exclusive member offers.
      </p>
    </div>

    <p style="color: #999; font-size: 13px; margin-top: 24px; line-height: 1.5;">
      If you didn't create an account with us, you can safely ignore this email.
    </p>
  `;

  return {
    subject: SUBJECT,
    html: baseLayout({
      preheaderText: `Welcome to GPSFDK! Your verification code is ${otp}`,
      content,
    }),
  };
};

module.exports = emailVerificationEmail;
