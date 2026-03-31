const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { sendWhatsAppOtp, verifyWhatsAppOtp, resendWhatsAppOtp } = require('../utils/whatsappOtp');
const rateLimit = require('express-rate-limit');

// ─── Rate limiters ───────────────────────────────────────────────────────────

// Allow max 5 OTP sends per 10 minutes per IP
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Allow max 10 verify attempts per 10 minutes per IP
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { message: 'Too many verification attempts. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── In-memory OTP session store ─────────────────────────────────────────────
// Maps userId -> { requestId, phone, attempts, sentAt }
// In production at scale, replace with Redis. For this app, in-memory is fine.
const otpSessions = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000;  // 10 minutes
const MAX_ATTEMPTS = 3;

// Cleanup expired sessions every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of otpSessions.entries()) {
    if (now - session.sentAt > OTP_EXPIRY_MS) {
      otpSessions.delete(key);
    }
  }
}, 15 * 60 * 1000);

// ─── POST /api/whatsapp-otp/send ─────────────────────────────────────────────
router.post('/send', protect, otpSendLimiter, async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Validate phone
    // Validate phone (6-15 digits, optional +)
    if (!phone || !/^\+?[0-9]{6,15}$/.test(phone)) {
      return res.status(400).json({ message: 'Please provide a valid mobile number.' });
    }

    const userId = req.user._id.toString();
    const existing = otpSessions.get(userId);

    // Enforce 30-second cooldown between sends (same phone)
    if (existing && existing.phone === phone) {
      const elapsed = Date.now() - existing.sentAt;
      if (elapsed < 30 * 1000) {
        const remaining = Math.ceil((30 * 1000 - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${remaining} seconds before requesting a new OTP.`,
          retryAfter: remaining,
        });
      }
    }

    const result = await sendWhatsAppOtp(phone);

    if (!result.success) {
      return res.status(502).json({ message: result.message || 'Failed to send OTP. Please try again.' });
    }

    // Store session
    otpSessions.set(userId, {
      requestId: result.requestId,
      phone,
      attempts: 0,
      sentAt: Date.now(),
    });

    res.json({
      success: true,
      message: `OTP sent to WhatsApp number ending in ${phone.slice(-4)}`,
      // Return requestId to frontend so it can pass it back on verify
      requestId: result.requestId,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/whatsapp-otp/verify ───────────────────────────────────────────
router.post('/verify', protect, otpVerifyLimiter, async (req, res, next) => {
  try {
    const { otp, requestId } = req.body;
    const userId = req.user._id.toString();

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be exactly 6 digits.' });
    }

    const session = otpSessions.get(userId);

    // No session found
    if (!session) {
      return res.status(400).json({ message: 'No OTP session found. Please request a new OTP.' });
    }

    // Check expiry
    if (Date.now() - session.sentAt > OTP_EXPIRY_MS) {
      otpSessions.delete(userId);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (session.attempts >= MAX_ATTEMPTS) {
      otpSessions.delete(userId);
      return res.status(400).json({
        message: 'Too many incorrect attempts. Please request a new OTP.',
        locked: true,
      });
    }

    // Increment attempts
    session.attempts += 1;

    const result = await verifyWhatsAppOtp(requestId || session.requestId, otp, session.phone);

    if (!result.success) {
      const remaining = MAX_ATTEMPTS - session.attempts;
      return res.status(400).json({
        message: result.message || 'Invalid OTP. Please try again.',
        attemptsRemaining: remaining,
        locked: remaining <= 0,
      });
    }

    // OTP verified — clean up session
    otpSessions.delete(userId);

    // Issue a short-lived phone-verified token (15 min)
    const verifiedToken = jwt.sign(
      { userId, phone: session.phone, phoneVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Phone number verified successfully!',
      verifiedToken,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/whatsapp-otp/resend ───────────────────────────────────────────
router.post('/resend', protect, otpSendLimiter, async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const session = otpSessions.get(userId);

    if (!session) {
      return res.status(400).json({ message: 'No active OTP session. Please start a new one.' });
    }

    // 30-second cooldown
    const elapsed = Date.now() - session.sentAt;
    if (elapsed < 30 * 1000) {
      const remaining = Math.ceil((30 * 1000 - elapsed) / 1000);
      return res.status(429).json({
        message: `Please wait ${remaining} seconds before resending.`,
        retryAfter: remaining,
      });
    }

    const result = await resendWhatsAppOtp(session.requestId, session.phone);

    if (!result.success) {
      // Fall back: send a new OTP if resend fails
      const newResult = await sendWhatsAppOtp(session.phone);
      if (!newResult.success) {
        return res.status(502).json({ message: 'Failed to resend OTP. Please try again.' });
      }
      session.requestId = newResult.requestId;
    }

    // Reset timer and attempts
    session.sentAt = Date.now();
    session.attempts = 0;
    otpSessions.set(userId, session);

    res.json({
      success: true,
      message: `OTP resent to WhatsApp number ending in ${session.phone.slice(-4)}`,
      requestId: session.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
