/**
 * Login OTP Email Template
 * Sent when a user logs in using OTP-based authentication.
 *
 * IMPORTANT: This template must NOT contain any references to
 * "Reset Password", "Forgot Password", or recovery wording.
 */

const { baseLayout, BRAND_COLOR } = require('./baseLayout');

const SUBJECT = 'Your Login Verification Code - GPSFDK';

const loginOtpEmail = (userName, otp) => {
  const greeting = userName && userName !== 'there' ? userName : 'there';

  const content = `
    <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
    <h2 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 700;">
      Verify Your Login
    </h2>
    <p style="color: #555; margin: 16px 0 0; font-size: 15px; line-height: 1.7;">
      Hi ${greeting},<br>
      Use the verification code below to securely sign in to your account.
    </p>

    <!-- OTP Box -->
    <div class="otp-container">
      <h1 class="otp-code">${otp}</h1>
    </div>

    <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 0;">
      This code is valid for <strong style="color: #555;">10 minutes</strong>.
    </p>

    <div style="margin-top: 28px; padding: 16px 20px; background: #fef2f2; border-radius: 10px; border-left: 4px solid #e84a4a;">
      <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
        ⚠️ <strong>Didn't try to sign in?</strong> Someone may be trying to access your account. Please secure your account by changing your password immediately.
      </p>
    </div>
  `;

  return {
    subject: SUBJECT,
    html: baseLayout({
      preheaderText: `Your GPSFDK login verification code is ${otp}`,
      content,
    }),
  };
};

module.exports = loginOtpEmail;
