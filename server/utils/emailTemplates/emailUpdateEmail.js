/**
 * Email Update Verification Template
 * Sent to the NEW email address when a user requests to update their email.
 * Migrated from the legacy emailUpdateOtpTemplate.js into the modular system.
 */

const { baseLayout, BRAND_COLOR } = require('./baseLayout');

const SUBJECT = 'Verify Your New Email - GPSFDK';

const emailUpdateEmail = (userName, otp) => {
  const greeting = userName && userName !== 'there' ? userName : 'there';

  const content = `
    <div style="font-size: 48px; margin-bottom: 16px;">📧</div>
    <h2 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 700;">
      Verify Your New Email
    </h2>
    <p style="color: #555; margin: 16px 0 0; font-size: 15px; line-height: 1.7;">
      Hi ${greeting},<br>
      You requested to update your email address. Use the code below to verify this new email and complete the change.
    </p>

    <!-- OTP Box -->
    <div class="otp-container">
      <h1 class="otp-code">${otp}</h1>
    </div>

    <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 0;">
      This code is valid for <strong style="color: #555;">10 minutes</strong>.
    </p>

    <p style="color: #999; font-size: 13px; margin-top: 24px; line-height: 1.5;">
      If you didn't request this change, you can safely ignore this email. Your current email address will remain unchanged.
    </p>
  `;

  return {
    subject: SUBJECT,
    html: baseLayout({
      preheaderText: `Your GPSFDK email verification code is ${otp}`,
      content,
    }),
  };
};

module.exports = emailUpdateEmail;
