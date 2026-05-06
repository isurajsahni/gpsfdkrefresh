/**
 * Account Recovery Email Template
 * Sent when a user is trying to recover their account or verify their identity.
 */

const { baseLayout, BRAND_COLOR } = require('./baseLayout');

const SUBJECT = 'Account Recovery Verification - GPSFDK';

const accountRecoveryEmail = (userName, otp) => {
  const greeting = userName && userName !== 'there' ? userName : 'there';

  const content = `
    <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
    <h2 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 700;">
      Verify Your Identity
    </h2>
    <p style="color: #555; margin: 16px 0 0; font-size: 15px; line-height: 1.7;">
      Hi ${greeting},<br>
      We received a request to recover your account. Use the verification code below to confirm your identity and regain access.
    </p>

    <!-- OTP Box -->
    <div class="otp-container">
      <h1 class="otp-code">${otp}</h1>
    </div>

    <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 0;">
      This code is valid for <strong style="color: #555;">10 minutes</strong>.
    </p>

    <div style="margin-top: 28px; padding: 16px 20px; background: #fef9f0; border-radius: 10px; border-left: 4px solid #e8a830;">
      <p style="margin: 0; font-size: 13px; color: #8a6d3b; line-height: 1.5;">
        🔐 <strong>Security Notice:</strong> If you didn't request account recovery, please ignore this email and ensure your account is secure. No changes will be made.
      </p>
    </div>
  `;

  return {
    subject: SUBJECT,
    html: baseLayout({
      preheaderText: `Your GPSFDK account recovery code is ${otp}`,
      content,
    }),
  };
};

module.exports = accountRecoveryEmail;
