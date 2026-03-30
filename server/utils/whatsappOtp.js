/**
 * MSG91 WhatsApp OTP Service
 * Handles sending and verifying OTPs via MSG91's WhatsApp OTP API.
 *
 * Env vars required:
 *   MSG91_AUTH_KEY       — Your MSG91 auth key
 *   MSG91_TEMPLATE_ID    — Your approved Meta OTP template ID
 *   MSG91_WIDGET_ID      — (optional) Widget ID if using MSG91 widget flow
 */

const SEND_URL = 'https://api.msg91.com/api/v5/otp';
const VERIFY_URL = 'https://api.msg91.com/api/v5/otp/verify';
const RESEND_URL = 'https://api.msg91.com/api/v5/otp/retry';

/**
 * Send a WhatsApp OTP to the given phone number.
 * @param {string} phone - 10-digit Indian mobile number (without +91)
 * @returns {Promise<{ success: boolean, requestId?: string, message?: string }>}
 */
const sendWhatsAppOtp = async (phone) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    throw new Error('MSG91 configuration missing. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in .env');
  }

  // MSG91 expects mobile in format: 91XXXXXXXXXX (country code + number)
  const mobile = `91${phone}`;

  const params = new URLSearchParams({
    authkey: authKey,
    template_id: templateId,
    mobile,
    otp_length: '6',
    otp_expiry: '10', // minutes
  });

  const response = await fetch(`${SEND_URL}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  // MSG91 returns { type: 'success', request_id: '...' } on success
  if (data.type === 'success' || response.ok) {
    return { success: true, requestId: data.request_id || data.requestId };
  }

  return { success: false, message: data.message || 'Failed to send OTP' };
};

/**
 * Verify an OTP entered by the user.
 * @param {string} requestId  - The request_id returned from sendWhatsAppOtp
 * @param {string} otp        - The 6-digit OTP entered by the user
 * @param {string} phone      - 10-digit mobile number (without +91)
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const verifyWhatsAppOtp = async (requestId, otp, phone) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const mobile = `91${phone}`;

  const params = new URLSearchParams({
    authkey: authKey,
    request_id: requestId,
    otp,
    mobile,
  });

  const response = await fetch(`${VERIFY_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (data.type === 'success') {
    return { success: true };
  }

  return { success: false, message: data.message || 'Invalid or expired OTP' };
};

/**
 * Resend an OTP for an existing request.
 * @param {string} requestId - The original request_id
 * @param {string} phone     - 10-digit mobile number
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const resendWhatsAppOtp = async (requestId, phone) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const mobile = `91${phone}`;

  const params = new URLSearchParams({
    authkey: authKey,
    request_id: requestId,
    retrytype: 'text', // fallback to SMS if WhatsApp fails
    mobile,
  });

  const response = await fetch(`${RESEND_URL}?${params.toString()}`, {
    method: 'GET',
  });

  const data = await response.json();

  if (data.type === 'success') {
    return { success: true };
  }

  return { success: false, message: data.message || 'Failed to resend OTP' };
};

module.exports = { sendWhatsAppOtp, verifyWhatsAppOtp, resendWhatsAppOtp };
