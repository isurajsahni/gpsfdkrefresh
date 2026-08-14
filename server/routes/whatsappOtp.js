const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getAuthEmail } = require('../utils/emailTemplates');
const { sendWhatsappOtpTemplate } = require('../utils/metaWhatsappOtp');
const { protect, admin } = require('../middleware/auth');

// Mirrors authController.generateToken — kept local so this route doesn't
// circular-import the controller.
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Compare two phone numbers ignoring formatting (spaces, +country prefix).
// Matches the last-10-digit convention already used for Shiprocket payloads.
const normalizePhone = (v) => {
  const digits = String(v || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};
// A blank/short stored phone can never match — an account with no phone on file
// is therefore never unlocked by a phone OTP.
const samePhone = (a, b) => {
  const x = normalizePhone(a);
  return x.length >= 10 && x === normalizePhone(b);
};

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
// Useful for debugging "OTP not arriving" reports. Admin-only: even though it
// masks secrets, the config state (channel availability, PHONE_NUMBER_ID last-4,
// token length, infra hints) is reconnaissance an attacker shouldn't get for free.
router.get('/diagnose', protect, admin, (req, res) => {
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
      templateName: process.env.WHATSAPP_OTP_TEMPLATE || 'new_login_template',
      templateLang: process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en_US',
      templateNote: 'Authentication template (1 body param = OTP, 1 button param = OTP). Language must match exactly what Meta shows for the template — "English" = en, "English (US)" = en_US.',
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
    const generatedOtp = crypto.randomInt(100000, 1000000).toString();

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
      sendPromises.push(
        sendWhatsappOtpTemplate(phoneNumber, generatedOtp)
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
//
// Two modes:
//   1) {phoneNumber, otp}                — verify only (legacy)
//   2) {phoneNumber, otp, userData: {...}} — verify + upsert User + return token
//
// Mode 2 is used by guest checkout to auto-create an account once the contact
// details are proven (OTP delivery to phone/email = proof of ownership), so the
// rest of the checkout flow runs as a logged-in user.
router.post('/verify', verifyOtpLimiter, async (req, res) => {
  try {
    const { phoneNumber, otp, userData } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const otpRecord = await Otp.findOne({ phoneNumber, otp }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP or phone number' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Single-use: delete the OTP regardless of which mode we're in.
    const otpEmail = otpRecord.email || null;
    await Otp.deleteOne({ _id: otpRecord._id });

    console.log(`✅ Verification successful for ${phoneNumber}`);

    // ─── Mode 1: legacy verify-only ────────────────────────────────────────
    if (!userData || (!userData.email && !otpEmail)) {
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
      });
    }

    // ─── Mode 2: auto-account + auto-login ─────────────────────────────────
    // SECURITY — read before changing any of this.
    // /send delivers the SAME code to the phone (WhatsApp) *and* to whatever
    // email the caller supplied. Holding the code therefore proves control of
    // the PHONE only; the email is caller-supplied on both requests and proves
    // nothing. Two rules follow, and both are load-bearing:
    //   1. Look the account up by the email captured at send time — NEVER by
    //      `userData.email` from this request body. Trusting that let anyone
    //      OTP their own number, name a victim's email here, and receive a
    //      valid 7-day session for that account, admins included.
    //   2. Only unlock an EXISTING account when its stored phone matches the
    //      number this OTP was delivered to. Rule 1 alone is not enough: the
    //      attacker also chooses `email` at /send time, so the stored otpEmail
    //      can be the victim's just as easily.
    // Net effect: creating a NEW account is unchanged, and a returning customer
    // whose phone is on file still auto-logs-in. Anyone else is told the code
    // was verified but gets no session and no write to the account.
    const email = String(otpEmail || '').toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // Verified successfully, but we can't create an account without an email.
      // Still return success so checkout proceeds as guest.
      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    }

    const name = (userData.name || '').trim() || 'Customer';
    const address = userData.address || null;
    const addresses = address && address.addressLine1 ? [{ ...address, isDefault: true }] : [];

    let user = await User.findOne({ email });
    let createdAccount = false;

    if (!user) {
      // New account — random password satisfies the schema's minlength(8) while
      // remaining unusable for password login (the user must use OTP / reset).
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      user = await User.create({
        name,
        email,
        phone: phoneNumber,
        password: randomPassword,
        addresses,
      });
      createdAccount = true;
      console.log(`👤 Auto-created account for ${email} during checkout`);
    } else if (!samePhone(user.phone, phoneNumber)) {
      // The code proves control of `phoneNumber`, which is NOT the number on
      // this account (or the account has none). Whoever is calling has not
      // proven they own this account, so: no token, and no write to the record.
      // Returning the same generic success as the no-email path keeps this from
      // doubling as an "is this email registered / what is its phone" oracle.
      console.warn(
        `⛔ OTP verify: phone ${normalizePhone(phoneNumber)} does not match the account on file for ${email} — no session issued`
      );
      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
      // Existing account AND the verified phone matches the one on file, so the
      // caller has proven ownership. Safe to refresh details and issue a token.
      let dirty = false;
      if (!user.name && name) { user.name = name; dirty = true; }
      if (address && address.addressLine1) {
        const exists = (user.addresses || []).some(a =>
          a.addressLine1 === address.addressLine1 &&
          a.pincode === address.pincode &&
          a.city === address.city
        );
        if (!exists) {
          if (!user.addresses?.length) {
            user.addresses = [{ ...address, isDefault: true }];
          } else {
            user.addresses.push(address);
          }
          dirty = true;
        }
      }
      if (dirty) await user.save();
      console.log(`🔐 Logged in existing account ${email} after OTP verification`);
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      createdAccount,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar || '',
      addresses: user.addresses || [],
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error('❌ Verify OTP Error:', error.message);
    res.status(500).json({ message: 'Internal server error during verification' });
  }
});

module.exports = router;
