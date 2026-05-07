/**
 * Authentication Email Templates — Dynamic Selector
 *
 * Central module that exports all auth email templates and provides
 * a dynamic `getAuthEmail(type, userName, otp)` function that returns
 * the correct { subject, html } based on the authentication action.
 *
 * Supported types:
 *   'reset-password'      — Forgot password flow
 *   'login-otp'           — OTP-based login verification
 *   'email-verification'  — New user sign-up email verification
 *   'account-recovery'    — Account/identity recovery
 *   'email-update'        — Email address change verification
 */

const resetPasswordEmail = require('./resetPasswordEmail');
const loginOtpEmail = require('./loginOtpEmail');
const emailVerificationEmail = require('./emailVerificationEmail');
const accountRecoveryEmail = require('./accountRecoveryEmail');
const emailUpdateEmail = require('./emailUpdateEmail');

/**
 * Dynamically select and generate the correct auth email template.
 *
 * @param {string} type     - The auth action type (e.g. 'reset-password', 'login-otp')
 * @param {string} userName - User's name for personalization (falls back to 'there')
 * @param {string} otp      - The 6-digit OTP code
 * @returns {{ subject: string, html: string }} Ready-to-send email data
 */
function getAuthEmail(type, userName, otp) {
  const name = userName || 'there';
  
  console.log("EMAIL TYPE:", type);
  console.log("TEMPLATE USED:", type);
  switch (type) {
    case 'reset-password':
      return resetPasswordEmail(name, otp);

    case 'login-otp':
      return loginOtpEmail(name, otp);

    case 'email-verification':
      return emailVerificationEmail(name, otp);

    case 'account-recovery':
      return accountRecoveryEmail(name, otp);

    case 'email-update':
      return emailUpdateEmail(name, otp);

    default:
      throw new Error(`Unknown auth email type: "${type}". Supported types: reset-password, login-otp, email-verification, account-recovery, email-update`);
  }
}

module.exports = {
  getAuthEmail,
  // Also export individual templates for direct use if needed
  resetPasswordEmail,
  loginOtpEmail,
  emailVerificationEmail,
  accountRecoveryEmail,
  emailUpdateEmail,
};
