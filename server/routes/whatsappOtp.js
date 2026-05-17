const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const axios = require('axios');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
const { getAuthEmail } = require('../utils/emailTemplates');

// Aggressive per-IP limits — OTP send/verify is a common abuse vector
// (SMS pumping on WhatsApp template costs, spamming inboxes). The 60-second
// per-phone cooldown is enforced inside /send too, but that uses the phone
// number; per-IP catches the case where attackers rotate numbers.
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests from this network. Try again later.' },
});
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Try again later.' },
});

/**
 * WhatsApp + Email Dual OTP System
 * 
 * Flow:
 * 1. User provides phone number + email
 * 2. Same 6-digit OTP is sent via WhatsApp AND Email simultaneously
 * 3. User can verify using the OTP received on either channel
 * 4. Single OTP record in DB — no duplication
 */

// GET /api/whatsapp-otp/diagnose
// Returns which OTP channels are configured WITHOUT exposing secrets.
// Useful for debugging "OTP not arriving" reports — you can curl this from
// a browser/Postman and immediately see which env vars Render is missing.
router.get('/diagnose', (req, res) => {
  const status = {
    email: {
      configured: Boolean(process.env.RESEND_API_KEY || process.env.EMAIL_PASS),
      sender: process.env.EMAIL_FROM || '(falls back to onboarding@resend.dev — sandbox only)',
      hint: process.env.RESEND_API_KEY ? null : 'Set RESEND_API_KEY in Render env',
    },
    whatsapp: {
      configured: Boolean(process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID),
      phoneNumberId: process.env.PHONE_NUMBER_ID
        ? `✓ set (…${String(process.env.PHONE_NUMBER_ID).slice(-4)})`
        : '✗ missing',
      tokenLength: process.env.WHATSAPP_TOKEN
        ? `✓ set (${String(process.env.WHATSAPP_TOKEN).length} chars)`
        : '✗ missing',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v22.0',
      templateName: process.env.WHATSAPP_OTP_TEMPLATE || 'otp_verification',
      templateLang: process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en',
      templateNote: 'Template must exist & be APPROVED in Meta Business Manager. Override the name / language via WHATSAPP_OTP_TEMPLATE / WHATSAPP_OTP_TEMPLATE_LANG.',
      hint: (!process.env.WHATSAPP_TOKEN || !process.env.PHONE_NUMBER_ID)
        ? 'Set WHATSAPP_TOKEN and PHONE_NUMBER_ID in Render env'
        : null,
    },
  };
  res.json({
    ok: status.email.configured || status.whatsapp.configured,
    ...status,
    note: 'Both channels must work AT LEAST ONE to send OTPs. If both are unconfigured, OTPs will fail.',
  });
});

// POST /api/whatsapp-otp/send
router.post('/send', sendOtpLimiter, async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    // Validate: phone is required, email is optional but recommended
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Basic email validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // ─── Early config check ──────────────────────────────────────────────
    const hasWhatsappConfig = Boolean(process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID);
    const hasEmailConfig = Boolean(process.env.RESEND_API_KEY || process.env.EMAIL_PASS);
    if (!hasWhatsappConfig && !hasEmailConfig) {
      console.error('🚫 OTP send aborted: NO OTP channels configured on the server.');
      return res.status(503).json({
        message: 'OTP service is not configured. Please contact support.',
        hint: 'Server admin: set WHATSAPP_TOKEN + PHONE_NUMBER_ID, and/or RESEND_API_KEY + EMAIL_FROM',
      });
    }

    // 1. Cooldown Check: Prevent sending OTP if one was sent in the last 60 seconds
    const lastOtp = await Otp.findOne({ phoneNumber }).sort({ createdAt: -1 });
    if (lastOtp && (new Date() - lastOtp.createdAt) < 60000) {
      return res.status(429).json({ message: 'Please wait 60 seconds before requesting another OTP' });
    }

    // 2. Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save to Database (Expires in 5 minutes)
    await Otp.create({
      phoneNumber,
      email: email || null,
      otp: generatedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // 4. Send OTP via BOTH channels simultaneously
    const sendPromises = [];

    // 4a. WhatsApp Channel — only when configured. Skipping cleanly when not
    // configured beats sending undefined as a Bearer token (Meta returns 401).
    if (hasWhatsappConfig) {
      // Graph API version, template name, and language are all overridable via env
      // so you can swap them without a redeploy when Meta deprecates v19, or when
      // you create a differently-named template (e.g. gpsfdk_otp / en_US).
      const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
      const templateName = process.env.WHATSAPP_OTP_TEMPLATE || 'otp_verification';
      const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en';
      const supportPhoneNumber = process.env.SUPPORT_PHONE_NUMBER || '+916280310103';

      const whatsappUrl = `https://graph.facebook.com/${apiVersion}/${process.env.PHONE_NUMBER_ID}/messages`;

      const whatsappPayload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: generatedOtp },
                { type: "text", text: supportPhoneNumber }
              ]
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                { type: "text", text: generatedOtp }
              ]
            }
          ]
        }
      };

      sendPromises.push(
        axios.post(whatsappUrl, whatsappPayload, {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        .then(() => {
          console.log(`✅ WhatsApp OTP sent to ${phoneNumber}`);
          return { channel: 'whatsapp', success: true };
        })
        .catch((err) => {
          // Surface the real Meta error so the operator can fix it
          // (typical: "Template name does not exist", "Phone number not in business
          // account", "Access token expired", or "(#131030) Recipient not in WhatsApp").
          const reason = err.response?.data?.error?.message
            || err.response?.data?.error?.error_user_msg
            || err.message
            || 'WhatsApp send failed';
          const code = err.response?.data?.error?.code;
          console.error(`❌ WhatsApp OTP failed for ${phoneNumber}: ${reason}${code ? ` (code ${code})` : ''}`);
          return { channel: 'whatsapp', success: false, reason };
        })
      );
    } else {
      sendPromises.push(Promise.resolve({ channel: 'whatsapp', success: false, reason: 'WhatsApp not configured on server' }));
    }

    // 4b. Email Channel — only when an email was supplied AND server is configured
    if (email && hasEmailConfig) {
      sendPromises.push(
        sendEmail({
          email,
          ...getAuthEmail('login-otp', 'Customer', generatedOtp)
        })
        .then(() => {
          console.log(`✅ Email OTP sent to ${email}`);
          return { channel: 'email', success: true };
        })
        .catch((err) => {
          // Typical: "Domain not verified", "Sender address rejected".
          const reason = err.message || 'Email send failed';
          console.error(`❌ Email OTP failed for ${email}: ${reason}`);
          return { channel: 'email', success: false, reason };
        })
      );
    } else if (email && !hasEmailConfig) {
      sendPromises.push(Promise.resolve({ channel: 'email', success: false, reason: 'Email not configured on server' }));
    }

    // Wait for both channels to finish
    const results = await Promise.all(sendPromises);

    // Check if at least one channel succeeded
    const anySuccess = results.some(r => r.success);

    if (!anySuccess) {
      // Surface the actual reasons so the client can show something useful
      // instead of a generic "please try again".
      const reasons = results.map(r => `${r.channel}: ${r.reason || 'unknown'}`).join('; ');
      console.error(`🚫 All OTP channels failed: ${reasons}`);
      return res.status(502).json({
        message: 'We could not send your verification code on any channel. Please contact support.',
        reasons,
        channels: results, // includes per-channel reason for client display / debugging
      });
    }

    const channels = results.filter(r => r.success).map(r => r.channel);
    console.log(`📤 OTP sent successfully via: ${channels.join(', ')}`);

    res.status(200).json({
      success: true,
      message: `OTP sent via ${channels.join(' & ')}`,
      channels,
      // Include any partial failure so the UI can hint "we couldn't reach WhatsApp,
      // please check your email" without misleading the user.
      failures: results.filter(r => !r.success).map(r => ({ channel: r.channel, reason: r.reason })),
    });

  } catch (error) {
    console.error('❌ Send OTP Error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// POST /api/whatsapp-otp/verify
router.post('/verify', verifyOtpLimiter, async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    // Find the latest OTP for this phone number
    const otpRecord = await Otp.findOne({ phoneNumber, otp }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP or phone number' });
    }

    // Check Expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Success: Delete OTP so it can't be reused
    await Otp.deleteOne({ _id: otpRecord._id });

    console.log(`✅ Verification successful for ${phoneNumber}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('❌ Verify OTP Error:', error.message);
    res.status(500).json({ message: 'Internal server error during verification' });
  }
});

module.exports = router;
