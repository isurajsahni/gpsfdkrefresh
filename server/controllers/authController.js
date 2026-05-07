const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const welcomeEmail = require('../utils/welcomeEmailTemplate');
const { getAuthEmail } = require('../utils/emailTemplates');
const { cloudinary } = require('../middleware/upload');

// ─── In-memory email-update OTP store ────────────────────────────────────────
// Maps userId -> { otp, newEmail, attempts, sentAt }
const emailOtpSessions = new Map();
const EMAIL_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const EMAIL_OTP_MAX_ATTEMPTS = 5;

// Cleanup expired email OTP sessions every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of emailOtpSessions.entries()) {
    if (now - session.sentAt > EMAIL_OTP_EXPIRY_MS) {
      emailOtpSessions.delete(key);
    }
  }
}, 15 * 60 * 1000);

// ─── In-memory registration OTP store ────────────────────────────────────────
// Maps email -> { otp, name, email, password, phone, attempts, sentAt }
const registrationOtpSessions = new Map();
const REG_OTP_EXPIRY_MS = 10 * 60 * 1000;
const REG_OTP_MAX_ATTEMPTS = 5;

// Cleanup expired registration OTP sessions every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of registrationOtpSessions.entries()) {
    if (now - session.sentAt > REG_OTP_EXPIRY_MS) {
      registrationOtpSessions.delete(key);
    }
  }
}, 15 * 60 * 1000);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Type safety — prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const user = await User.create({ name, email, password, phone });

    // Send welcome email to the new user (non-blocking)
    sendEmail({
      email: email,
      subject: 'Welcome to GPSFDK! 🎨',
      html: welcomeEmail(name || 'there'),
    }).catch(err => console.error('Welcome email failed:', err.message));

    // Send notification email to admin (non-blocking)
    sendEmail({
      email: process.env.ADMIN_EMAIL || 'suraj.gnimt@gmail.com',
      subject: 'New User Registration - GPSFDK',
      html: `
        <h3>New User Registered</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      `
    }).catch(err => console.error('Admin notification failed:', err.message));

    res.status(201).json({
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
    next(error);
  }
};

// POST /api/auth/send-registration-otp — Step 1: validate + send OTP via Email + WhatsApp
exports.sendRegistrationOtp = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input format.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists. Please login instead.' });
    }

    // 30-second cooldown
    const existing = registrationOtpSessions.get(normalizedEmail);
    if (existing) {
      const elapsed = Date.now() - existing.sentAt;
      if (elapsed < 30 * 1000) {
        const remaining = Math.ceil((30 * 1000 - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${remaining} seconds before requesting a new code.`,
          retryAfter: remaining,
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store pending registration + OTP
    registrationOtpSessions.set(normalizedEmail, {
      otp,
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone || '',
      attempts: 0,
      sentAt: Date.now(),
    });

    // ─── Send OTP via BOTH channels simultaneously ───
    const channels = [];

    // Channel 1: Email (always sent)
    const emailPromise = sendEmail({
      email: normalizedEmail,
      ...getAuthEmail('email-verification', name.trim(), otp),
    })
    .then(() => { channels.push('email'); console.log(`✅ Registration OTP emailed to ${normalizedEmail}`); })
    .catch(err => console.error(`❌ Registration OTP email failed:`, err.message));

    // Channel 2: WhatsApp (sent if phone number provided and WhatsApp API is configured)
    let whatsappPromise = Promise.resolve();
    if (phone && process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID) {
      const whatsappPhone = phone.replace(/\D/g, ''); // strip non-digits
      if (whatsappPhone.length >= 10) {
        const axios = require('axios');
        whatsappPromise = axios.post(
          `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: whatsappPhone,
            type: 'template',
            template: {
              name: 'otp_verification',
              language: { code: 'en' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: otp },
                    { type: 'text', text: '+916280310103' }
                  ]
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [{ type: 'text', text: otp }]
                }
              ]
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        )
        .then(() => { channels.push('whatsapp'); console.log(`✅ Registration OTP WhatsApp sent to ${whatsappPhone}`); })
        .catch(err => console.error(`❌ Registration OTP WhatsApp failed:`, err.response?.data?.error?.message || err.message));
      }
    }

    // Wait for both to finish
    await Promise.all([emailPromise, whatsappPromise]);

    if (channels.length === 0) {
      return res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
    }

    const channelText = channels.join(' & ');
    const maskedEmail = normalizedEmail.replace(/(.{2}).+(@.+)/, '$1***$2');

    res.json({
      success: true,
      message: `Verification code sent via ${channelText}`,
      channels,
      maskedEmail,
    });
  } catch (error) {
    next(error);
  }
};


// POST /api/auth/verify-registration-otp — Step 2: verify OTP + create account
exports.verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Email and a 6-digit OTP are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const session = registrationOtpSessions.get(normalizedEmail);

    if (!session) {
      return res.status(400).json({ message: 'No verification session found. Please register again.' });
    }

    // Check expiry
    if (Date.now() - session.sentAt > REG_OTP_EXPIRY_MS) {
      registrationOtpSessions.delete(normalizedEmail);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check attempts
    if (session.attempts >= REG_OTP_MAX_ATTEMPTS) {
      registrationOtpSessions.delete(normalizedEmail);
      return res.status(400).json({ message: 'Too many incorrect attempts. Please register again.', locked: true });
    }

    session.attempts += 1;

    if (session.otp !== otp) {
      const remaining = REG_OTP_MAX_ATTEMPTS - session.attempts;
      return res.status(400).json({
        message: 'Invalid verification code.',
        attemptsRemaining: remaining,
        locked: remaining <= 0,
      });
    }

    // OTP is correct — create the user
    registrationOtpSessions.delete(normalizedEmail);

    // Double-check user doesn't exist (race condition guard)
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists. Please login instead.' });
    }

    const user = await User.create({
      name: session.name,
      email: session.email,
      password: session.password,
      phone: session.phone,
    });

    // Welcome email (non-blocking)
    sendEmail({
      email: session.email,
      subject: 'Welcome to GPSFDK! 🎨',
      html: welcomeEmail(session.name || 'there'),
    }).catch(err => console.error('Welcome email failed:', err.message));

    // Admin notification (non-blocking)
    sendEmail({
      email: process.env.ADMIN_EMAIL || 'suraj.gnimt@gmail.com',
      subject: 'New User Registration - GPSFDK',
      html: `
        <h3>New User Registered</h3>
        <p><strong>Name:</strong> ${session.name}</p>
        <p><strong>Email:</strong> ${session.email}</p>
        <p><strong>Phone:</strong> ${session.phone || 'N/A'}</p>
      `
    }).catch(err => console.error('Admin notification failed:', err.message));

    res.status(201).json({
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
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Type safety — prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid credentials format' });
    }

    const user = await User.findOne({ email });

    // Account lockout check
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ message: 'Account temporarily locked. Please try again later.' });
    }

    if (user && (await user.matchPassword(password))) {
      // Reset failed attempts on successful login
      if (user.loginAttempts > 0) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        token: generateToken(user._id),
      });
    } else {
      // Track failed login attempts
      if (user) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        }
        await user.save();
      }
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // ── Free updates (no OTP required) ──
    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      user.password = req.body.password;
    }

    // ── Phone update (free — WhatsApp OTP disabled for now) ──
    if (req.body.phone && req.body.phone.trim() !== user.phone) {
      user.phone = req.body.phone.trim();
    }

    // ── Email update (requires emailVerifiedToken from Email OTP) ──
    if (req.body.email && req.body.email.trim().toLowerCase() !== user.email) {
      const { emailVerifiedToken } = req.body;
      if (!emailVerifiedToken) {
        return res.status(400).json({ message: 'Email verification required. Please verify via OTP first.' });
      }
      try {
        const decoded = jwt.verify(emailVerifiedToken, process.env.JWT_SECRET);
        if (!decoded.emailVerified || decoded.userId !== req.user._id.toString()) {
          return res.status(400).json({ message: 'Invalid email verification token.' });
        }
        // Check if new email is already used
        const emailInUse = await User.findOne({ email: req.body.email.trim().toLowerCase(), _id: { $ne: req.user._id } });
        if (emailInUse) {
          return res.status(400).json({ message: 'This email is already linked to another account.' });
        }
        user.email = req.body.email.trim().toLowerCase();
      } catch (e) {
        return res.status(400).json({ message: 'Email verification token expired or invalid.' });
      }
    }
    
    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      avatar: updated.avatar || '',
      addresses: updated.addresses || [],
      token: generateToken(updated._id),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/upload-avatar — upload profile image via Cloudinary
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If user already has a Cloudinary avatar URL, delete the old image
    if (user.avatar && user.avatar.startsWith('http') && user.avatar.includes('cloudinary')) {
      try {
        // Extract public_id from URL: https://res.cloudinary.com/.../gpsfdk-avatars/abc123.jpg
        const parts = user.avatar.split('/');
        const folderAndFile = parts.slice(-2).join('/'); // e.g. "gpsfdk-avatars/abc123"
        const publicId = folderAndFile.replace(/\.[^.]+$/, ''); // remove extension
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.error('Failed to delete old avatar from Cloudinary:', e.message);
      }
    }

    // Save the new Cloudinary URL
    user.avatar = req.file.path; // multer-storage-cloudinary sets this to the Cloudinary URL
    await user.save();

    res.json({
      success: true,
      avatar: user.avatar,
      message: 'Profile image updated!',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/send-email-update-otp
exports.sendEmailUpdateOtp = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user._id.toString();

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // Check if new email is already in use
    const emailInUse = await User.findOne({ email: newEmail.trim().toLowerCase(), _id: { $ne: req.user._id } });
    if (emailInUse) {
      return res.status(400).json({ message: 'This email is already linked to another account.' });
    }

    // 30-second cooldown
    const existing = emailOtpSessions.get(userId);
    if (existing) {
      const elapsed = Date.now() - existing.sentAt;
      if (elapsed < 30 * 1000) {
        const remaining = Math.ceil((30 * 1000 - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${remaining} seconds before requesting a new code.`,
          retryAfter: remaining,
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store session
    emailOtpSessions.set(userId, {
      otp,
      newEmail: newEmail.trim().toLowerCase(),
      attempts: 0,
      sentAt: Date.now(),
    });

    const user = await User.findById(req.user._id);

    // Send OTP email to the NEW email address
    await sendEmail({
      email: newEmail.trim().toLowerCase(),
      ...getAuthEmail('email-update', user.name, otp),
    });

    res.json({
      success: true,
      message: `Verification code sent to ${newEmail.replace(/(.{2}).+(@.+)/, '$1***$2')}`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-email-update-otp
exports.verifyEmailUpdateOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id.toString();

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be exactly 6 digits.' });
    }

    const session = emailOtpSessions.get(userId);

    if (!session) {
      return res.status(400).json({ message: 'No email verification session found. Please request a new code.' });
    }

    // Check expiry
    if (Date.now() - session.sentAt > EMAIL_OTP_EXPIRY_MS) {
      emailOtpSessions.delete(userId);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check attempts
    if (session.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      emailOtpSessions.delete(userId);
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.', locked: true });
    }

    session.attempts += 1;

    if (session.otp !== otp) {
      const remaining = EMAIL_OTP_MAX_ATTEMPTS - session.attempts;
      return res.status(400).json({
        message: 'Invalid verification code.',
        attemptsRemaining: remaining,
        locked: remaining <= 0,
      });
    }

    // OTP correct — clean up and issue token
    emailOtpSessions.delete(userId);

    const emailVerifiedToken = jwt.sign(
      { userId, newEmail: session.newEmail, emailVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Email verified successfully!',
      emailVerifiedToken,
      newEmail: session.newEmail,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users (admin)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/users/:id (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/users/:id/role (admin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (req.body.role) {
      if (!['user', 'admin', 'marketing', 'admin_marketing', 'order_manager', 'coupon_manager'].includes(req.body.role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = req.body.role;
      await user.save();
    }
    
    res.json({ message: 'User role updated', role: user.role });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found for security (prevent email enumeration)
      return res.json({ message: 'If that email exists, we have sent a reset code.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiration (10 minutes), reset attempt counter
    user.resetPasswordOtp = otp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;
    await user.save();

    // Send email
    await sendEmail({
      email: user.email,
      ...getAuthEmail('reset-password', user.name, otp),
    });

    res.json({ message: 'If that email exists, we have sent a reset code.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, resetPasswordExpire: { $gt: Date.now() } });

    if (!user || !user.resetPasswordOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Track attempts — invalidate OTP after 5 wrong tries
    if (!user.otpAttempts) user.otpAttempts = 0;
    user.otpAttempts += 1;

    if (user.otpAttempts > 5) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new code.' });
    }

    if (user.resetPasswordOtp !== otp) {
      await user.save();
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP matches — reset attempt counter
    user.otpAttempts = 0;
    await user.save();

    res.json({ message: 'OTP verified successfully', success: true });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Verify OTP again just in case
    const user = await User.findOne({ 
      email, 
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Update password
    user.password = newPassword; // The pre-save hook will hash it
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/addresses — save a new address to user profile
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Whitelist only allowed address fields — prevent mass assignment
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country } = req.body;
    const newAddress = { fullName, phone, addressLine1, addressLine2, city, state, pincode, country };

    // If this is the first address, mark it as default
    if (user.addresses.length === 0) newAddress.isDefault = true;
    
    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/addresses/:id — remove a saved address
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addressIndex = user.addresses.findIndex(a => a._id.toString() === req.params.id);
    if (addressIndex === -1) return res.status(404).json({ message: 'Address not found' });

    // If deleting the default address, reassign default to the next available
    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/addresses/:id — update an existing address
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addressIndex = user.addresses.findIndex(a => a._id.toString() === req.params.id);
    if (addressIndex === -1) return res.status(404).json({ message: 'Address not found' });

    // Update with whitelisted fields
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;
    
    const addr = user.addresses[addressIndex];
    if (fullName) addr.fullName = fullName;
    if (phone) addr.phone = phone;
    if (addressLine1) addr.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) addr.addressLine2 = addressLine2;
    if (city) addr.city = city;
    if (state) addr.state = state;
    if (pincode) addr.pincode = pincode;
    if (country) addr.country = country;
    if (isDefault !== undefined) addr.isDefault = isDefault;

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};


// ─── PASSWORDLESS AUTHENTICATION ─────────────────────────────────────────────
const passwordlessOtpSessions = new Map();

exports.sendPasswordlessOtp = async (req, res, next) => {
  try {
    const { identifier, channel } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Email or phone number is required.' });

    const isEmail = identifier.includes('@');
    const normalizedId = identifier.trim().toLowerCase();

    const existing = passwordlessOtpSessions.get(normalizedId);
    if (existing && Date.now() - existing.sentAt < 30000) {
      return res.status(429).json({ message: 'Please wait 30 seconds before requesting again.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    passwordlessOtpSessions.set(normalizedId, { otp, attempts: 0, sentAt: Date.now() });

    if (isEmail) {
      await sendEmail({
        email: normalizedId,
        ...getAuthEmail('login-otp', 'User', otp)
      });
      return res.json({ success: true, message: 'OTP sent via Email' });
    } else {
      if (channel === 'whatsapp' && process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID) {
        const whatsappPhone = normalizedId.replace(/\D/g, '');
        const axios = require('axios');
        try {
          await axios.post(
            `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: 'whatsapp',
              to: whatsappPhone,
              type: 'template',
              template: {
                name: 'otp_verification',
                language: { code: 'en' },
                components: [
                  { type: 'body', parameters: [{ type: 'text', text: otp }, { type: 'text', text: '+916280310103' }] },
                  { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] }
                ]
              }
            },
            { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
          );
          return res.json({ success: true, message: 'OTP sent via WhatsApp' });
        } catch (fbError) {
          console.error('WhatsApp Error:', fbError.response?.data || fbError.message);
          return res.status(400).json({ message: 'Failed to send WhatsApp message. Please try Email instead.' });
        }
      }
      return res.status(400).json({ message: 'Invalid channel or missing WhatsApp configuration.' });
    }
  } catch (error) {
    next(error);
  }
};

exports.verifyPasswordlessOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ message: 'Identifier and OTP required.' });

    const normalizedId = identifier.trim().toLowerCase();
    const session = passwordlessOtpSessions.get(normalizedId);

    if (!session) return res.status(400).json({ message: 'OTP session not found or expired.' });
    if (Date.now() - session.sentAt > 10 * 60 * 1000) {
      passwordlessOtpSessions.delete(normalizedId);
      return res.status(400).json({ message: 'OTP expired.' });
    }

    if (session.otp !== otp) {
      session.attempts++;
      if (session.attempts >= 5) passwordlessOtpSessions.delete(normalizedId);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    passwordlessOtpSessions.delete(normalizedId);

    // Find User
    const isEmail = normalizedId.includes('@');
    const query = isEmail ? { email: normalizedId } : { phone: { $regex: normalizedId.replace(/\D/g, ''), $options: 'i' } };
    const user = await User.findOne(query);

    if (user) {
      return res.json({
        isNewUser: false,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        token: generateToken(user._id),
      });
    } else {
      // User doesn't exist, issue temp token to complete registration
      const tempToken = jwt.sign({ identifier: normalizedId, isEmail, verified: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
      return res.json({ isNewUser: true, tempToken, identifier: normalizedId, isEmail });
    }
  } catch (error) {
    next(error);
  }
};

exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase token required.' });

    const axios = require('axios');
    const apiKey = "AIzaSyB0L41Eycq725nZf5GLMaKr6xZE2WYAqSk"; // User provided
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { idToken }
    );

    const firebaseUser = response.data.users[0];
    if (!firebaseUser || !firebaseUser.phoneNumber) {
      return res.status(400).json({ message: 'Invalid Firebase token or no phone number found.' });
    }

    const phone = firebaseUser.phoneNumber;
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);
    const user = await User.findOne({ phone: { $regex: phoneDigits, $options: 'i' } });

    if (user) {
      return res.json({
        isNewUser: false,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        token: generateToken(user._id),
      });
    } else {
      const tempToken = jwt.sign({ identifier: phone, isEmail: false, verified: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
      return res.json({ isNewUser: true, tempToken, identifier: phone, isEmail: false });
    }
  } catch (error) {
    console.error('Firebase verify error:', error.response?.data || error.message);
    next(new Error('Failed to verify Firebase token.'));
  }
};

exports.completePasswordlessRegistration = async (req, res, next) => {
  try {
    const { tempToken, name, email, phone } = req.body;
    if (!tempToken || !name) return res.status(400).json({ message: 'Temp token and name are required.' });

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid or expired registration token.' });
    }

    if (!decoded.verified) return res.status(400).json({ message: 'Not verified.' });

    const finalEmail = decoded.isEmail ? decoded.identifier : email;
    const finalPhone = decoded.isEmail ? phone : decoded.identifier;

    if (!finalEmail) return res.status(400).json({ message: 'Email is required for registration.' });

    const userExists = await User.findOne({ email: finalEmail.toLowerCase() });
    if (userExists) return res.status(400).json({ message: 'Email already in use.' });

    const user = await User.create({
      name,
      email: finalEmail.toLowerCase(),
      phone: finalPhone || '',
      password: Math.random().toString(36).slice(-10)
    });

    sendEmail({
      email: user.email,
      subject: 'Welcome to GPSFDK! 🎨',
      html: welcomeEmail(user.name),
    }).catch(() => {});

    res.status(201).json({
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
    next(error);
  }
};
