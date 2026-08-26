const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const welcomeEmail = require('../utils/welcomeEmailTemplate');
const { getAuthEmail } = require('../utils/emailTemplates');
const { cloudinary } = require('../middleware/upload');
const { createOtpStore } = require('../utils/otpSessionStore');
const { sendWhatsappOtpTemplate } = require('../utils/metaWhatsappOtp');

// ─── OTP / verification session stores (Mongo-backed, TTL-purged) ─────────────
// These used to be in-memory Maps. That made every OTP session non-recoverable
// across deploys/restarts, didn't work with multi-instance autoscaling, and
// kept plaintext registration passwords in process RAM. The new store persists
// sessions in Mongo with TTL — same Map-like API, just async.
const EMAIL_OTP_EXPIRY_MS = 10 * 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const REG_OTP_EXPIRY_MS = 10 * 60 * 1000;
const REG_OTP_MAX_ATTEMPTS = 5;

const emailOtpSessions = createOtpStore('emailUpdate', EMAIL_OTP_EXPIRY_MS);
const registrationOtpSessions = createOtpStore('registration', REG_OTP_EXPIRY_MS);

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
    const existing = await registrationOtpSessions.get(normalizedEmail);
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
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store pending registration + OTP
    await registrationOtpSessions.set(normalizedEmail, {
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
        whatsappPromise = sendWhatsappOtpTemplate(whatsappPhone, otp)
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
    const session = await registrationOtpSessions.get(normalizedEmail);

    if (!session) {
      return res.status(400).json({ message: 'No verification session found. Please register again.' });
    }

    // Check expiry
    if (Date.now() - session.sentAt > REG_OTP_EXPIRY_MS) {
      await registrationOtpSessions.delete(normalizedEmail);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check attempts
    if (session.attempts >= REG_OTP_MAX_ATTEMPTS) {
      await registrationOtpSessions.delete(normalizedEmail);
      return res.status(400).json({ message: 'Too many incorrect attempts. Please register again.', locked: true });
    }

    session.attempts += 1;

    if (session.otp !== otp) {
      const remaining = REG_OTP_MAX_ATTEMPTS - session.attempts;
      // Persist incremented attempts back to Mongo (Map mutation no longer works).
      await registrationOtpSessions.set(normalizedEmail, session);
      return res.status(400).json({
        message: 'Invalid verification code.',
        attemptsRemaining: remaining,
        locked: remaining <= 0,
      });
    }

    // OTP is correct — create the user
    await registrationOtpSessions.delete(normalizedEmail);

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
    // `avatar` is dual-purpose: an emoji picked in the dashboard, or the URL of
    // an image uploaded via /auth/upload-avatar. Accept those two shapes only.
    // Deletion no longer parses this string (see uploadAvatar), so this is
    // defence in depth — it stops the field being used to point at arbitrary
    // remote images. Anything else is rejected rather than silently stored.
    if (req.body.avatar !== undefined) {
      const next = String(req.body.avatar || '').trim();
      const isUrl = /^https?:\/\//i.test(next);
      const isOurCloudinary = /^https:\/\/res\.cloudinary\.com\//i.test(next);
      if (next === '' || (!isUrl && next.length <= 8) || isOurCloudinary) {
        user.avatar = next;
      } else {
        return res.status(400).json({ message: 'Invalid avatar' });
      }
    }

    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      // Re-authenticate before changing a password. Without proof of the current
      // password, a stolen/leaked JWT (7-day lifetime, stored in localStorage)
      // could silently take over the account by rotating the password. No current
      // frontend flow hits this branch; a future "change password" UI must send
      // `currentPassword`.
      const { currentPassword } = req.body;
      if (!currentPassword || !(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
      user.password = req.body.password;
    }

    // ── Phone update (free — WhatsApp OTP disabled for now) ──
    if (req.body.phone && req.body.phone.trim() !== user.phone) {
      user.phone = req.body.phone.trim();
    }

    // ── Email update (requires emailVerifiedToken from Email OTP) ──
    // Normalised once, exactly as `requestEmailUpdateOtp` normalises the address
    // it stores on the OTP session, so the comparison below is apples-to-apples.
    const requestedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (requestedEmail && requestedEmail !== user.email) {
      const { emailVerifiedToken } = req.body;
      if (!emailVerifiedToken) {
        return res.status(400).json({ message: 'Email verification required. Please verify via OTP first.' });
      }
      try {
        const decoded = jwt.verify(emailVerifiedToken, process.env.JWT_SECRET);
        if (!decoded.emailVerified || decoded.userId !== req.user._id.toString()) {
          return res.status(400).json({ message: 'Invalid email verification token.' });
        }
        // The token proves ownership of `decoded.newEmail` specifically — it is
        // not a blank cheque to set any address. Without this check a user could
        // complete the OTP flow for an address they DO own, then replay that
        // token while submitting a different, unverified address and have the
        // server bind it to their account. The `emailInUse` check below only
        // stops addresses that are already registered, so any unregistered
        // address could be claimed with no proof at all, defeating the OTP flow.
        if (decoded.newEmail !== requestedEmail) {
          return res.status(400).json({ message: 'Invalid email verification token.' });
        }
        // Check if new email is already used
        const emailInUse = await User.findOne({ email: requestedEmail, _id: { $ne: req.user._id } });
        if (emailInUse) {
          return res.status(400).json({ message: 'This email is already linked to another account.' });
        }
        user.email = requestedEmail;
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

    // Delete the previous avatar using the public_id WE recorded at upload time.
    // This used to parse a public_id back out of `user.avatar`, which
    // updateProfile accepts verbatim from the client — so any logged-in
    // customer could point it at a product image (public_id is exposed by
    // GET /api/products) and have this call destroy the catalogue's assets.
    // Keying off a server-set field means we can only ever delete an asset this
    // endpoint itself created in the avatars folder.
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (e) {
        console.error('Failed to delete old avatar from Cloudinary:', e.message);
      }
    }

    // Save the new Cloudinary URL + its public_id (multer-storage-cloudinary
    // sets `path` to the secure URL and `filename` to the public_id).
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename || req.file.public_id || '';
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
    const existing = await emailOtpSessions.get(userId);
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
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store session
    await emailOtpSessions.set(userId, {
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

    const session = await emailOtpSessions.get(userId);

    if (!session) {
      return res.status(400).json({ message: 'No email verification session found. Please request a new code.' });
    }

    // Check expiry
    if (Date.now() - session.sentAt > EMAIL_OTP_EXPIRY_MS) {
      await emailOtpSessions.delete(userId);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check attempts
    if (session.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      await emailOtpSessions.delete(userId);
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.', locked: true });
    }

    session.attempts += 1;

    if (session.otp !== otp) {
      const remaining = EMAIL_OTP_MAX_ATTEMPTS - session.attempts;
      // Persist incremented attempts
      await emailOtpSessions.set(userId, session);
      return res.status(400).json({
        message: 'Invalid verification code.',
        attemptsRemaining: remaining,
        locked: remaining <= 0,
      });
    }

    // OTP correct — clean up and issue token
    await emailOtpSessions.delete(userId);

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
    // Optional pagination + search — when admin opts in with ?paginate=true
    // returns an envelope; otherwise the legacy flat array (capped at 500
    // so we don't OOM by accident on a large user table).
    if (req.query.paginate === 'true') {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      // Hide anonymised (self-deleted) accounts from admin lists.
      const filter = { deletedAt: null };
      if (req.query.search) {
        const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(escape(String(req.query.search)), 'i');
        filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
      }
      if (req.query.role && req.query.role !== 'all') filter.role = req.query.role;
      const [users, total] = await Promise.all([
        User.find(filter).select('-password').sort('-createdAt').skip((page - 1) * limit).limit(limit),
        User.countDocuments(filter),
      ]);
      return res.json({ users, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) || 1 });
    }
    const users = await User.find({ deletedAt: null }).select('-password').sort('-createdAt').limit(500);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users/count — lightweight count for dashboards.
exports.getUsersCount = async (req, res, next) => {
  try {
    const count = await User.countDocuments({ deletedAt: null });
    res.json({ count });
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

// DELETE /api/auth/me — self-serve account deletion (Apple guideline 5.1.1(v)).
// Anonymises rather than hard-deletes: the document and its _id are kept so
// existing Order.user references stay valid and GST/accounting history is not
// orphaned, but every personal field is overwritten and deletedAt is stamped.
// email/phone are rewritten (not blanked) because email is required+unique —
// rewriting them also frees the real address/number for a fresh sign-up later.
exports.deleteOwnAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    // protect already 401s a missing/anonymised user, so reaching here with an
    // already-deleted account shouldn't happen — but stay idempotent just in case.
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.deletedAt) return res.json({ message: 'Account already deleted' });

    // Best-effort removal of the uploaded avatar asset (mirrors uploadAvatar).
    // Fire-and-forget: never block deletion on Cloudinary.
    if (user.avatarPublicId) {
      cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
    }

    const anonId = user._id.toString();
    user.name = 'Deleted user';
    // Unique, syntactically-valid, non-routable address tied to the _id.
    user.email = `deleted-${anonId}@deleted.invalid`;
    user.phone = '';
    user.addresses = [];
    user.avatar = '';
    user.avatarPublicId = '';
    // Invalidate password login — random value the user can never reproduce.
    // isModified('password') is true so the pre-save hook re-hashes it.
    user.password = crypto.randomBytes(32).toString('hex');
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    user.otpAttempts = 0;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.deletedAt = new Date();
    await user.save();

    res.json({ message: 'Your account has been deleted' });
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
    const otp = crypto.randomInt(100000, 1000000).toString();
    
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

    // Type safety — `resetPasswordValidation` currently blocks non-strings, but
    // this controller must not depend on a route's middleware list staying the
    // way it is. An object `otp` becomes an operator query below, and an object
    // `newPassword` sails past a `.length` check (`undefined < 8` is false) and
    // then explodes as a Mongoose CastError (a 500 instead of a 400).
    if (typeof email !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Look the account up by email + a live reset window ONLY — deliberately
    // NOT by the submitted code. Matching on `resetPasswordOtp: otp` (which is
    // what this did) makes a wrong code indistinguishable from "no reset
    // pending": there is no user document to count the miss against, so
    // verifyOtp's 5-strike lockout is skipped entirely by posting straight
    // here. The per-account counter below is the only thing bounding guesses
    // for a given account; the IP rate limiter on the route does not bound a
    // distributed attacker.
    const user = await User.findOne({ email, resetPasswordExpire: { $gt: Date.now() } });

    if (!user || !user.resetPasswordOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Same counter and lockout as verifyOtp. BOTH entry points must burn
    // attempts, otherwise whichever one doesn't becomes the free oracle.
    if (!user.otpAttempts) user.otpAttempts = 0;
    user.otpAttempts += 1;

    if (user.otpAttempts > 5) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new code.' });
    }

    // Length-checked constant-time compare — timingSafeEqual throws on a length
    // mismatch, and an early-exit `!==` leaks how much of the code was right.
    const submitted = Buffer.from(otp);
    const expected = Buffer.from(String(user.resetPasswordOtp));
    const otpMatches = submitted.length === expected.length && crypto.timingSafeEqual(submitted, expected);

    if (!otpMatches) {
      // Persist the incremented attempt count — same message as the "no reset
      // pending" branch above so this endpoint stays a non-oracle.
      await user.save();
      return res.status(400).json({ message: 'Invalid or expired OTP' });
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
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, label } = req.body;
    const newAddress = { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, label };

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
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault, label } = req.body;

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
    if (label !== undefined) addr.label = label;

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};


// ─── PASSWORDLESS AUTHENTICATION ─────────────────────────────────────────────
// Same migration as the other OTP stores — see top of file. 10-min TTL.
const passwordlessOtpSessions = createOtpStore('passwordless', 10 * 60 * 1000);

exports.sendPasswordlessOtp = async (req, res, next) => {
  try {
    const { identifier, channel } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Email or phone number is required.' });

    const isEmail = identifier.includes('@');
    const normalizedId = identifier.trim().toLowerCase();

    const existing = await passwordlessOtpSessions.get(normalizedId);
    if (existing && Date.now() - existing.sentAt < 30000) {
      return res.status(429).json({ message: 'Please wait 30 seconds before requesting again.' });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    await passwordlessOtpSessions.set(normalizedId, { otp, attempts: 0, sentAt: Date.now() });

    if (isEmail) {
      await sendEmail({
        email: normalizedId,
        ...getAuthEmail('login-otp', 'User', otp)
      });
      return res.json({ success: true, message: 'OTP sent via Email' });
    } else {
      if (channel === 'whatsapp' && process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID) {
        const whatsappPhone = normalizedId.replace(/\D/g, '');
        try {
          await sendWhatsappOtpTemplate(whatsappPhone, otp);
          return res.json({ success: true, message: 'OTP sent via WhatsApp' });
        } catch (fbError) {
          // Surface the real Meta error so we can fix template / language /
          // recipient issues without redeploying. Typical culprits:
          //   (#132001) Template name does not exist
          //   (#131030) Recipient phone number not in allowed list (dev mode)
          //   (#132000) Number of parameters does not match
          const reason = fbError.response?.data?.error?.message || fbError.message || 'WhatsApp send failed';
          console.error('WhatsApp Error:', fbError.response?.data || fbError.message);
          return res.status(400).json({
            message: 'Failed to send WhatsApp message. Please try Email instead.',
            reason,
          });
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
    const session = await passwordlessOtpSessions.get(normalizedId);

    if (!session) return res.status(400).json({ message: 'OTP session not found or expired.' });
    if (Date.now() - session.sentAt > 10 * 60 * 1000) {
      await passwordlessOtpSessions.delete(normalizedId);
      return res.status(400).json({ message: 'OTP expired.' });
    }

    if (session.otp !== otp) {
      session.attempts = (session.attempts || 0) + 1;
      if (session.attempts >= 5) {
        await passwordlessOtpSessions.delete(normalizedId);
      } else {
        // Persist incremented attempts so the next try sees the new count.
        await passwordlessOtpSessions.set(normalizedId, session);
      }
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    await passwordlessOtpSessions.delete(normalizedId);

    // Find User
    const isEmail = normalizedId.includes('@');
    // Match the last 10 digits anchored to end-of-string. The previous unanchored
    // substring regex could match a DIFFERENT user whose number merely contained
    // these digits mid-string. End-anchoring stays tolerant of stored country-code
    // prefixes (e.g. "+91…") while preventing false matches.
    const phoneDigits = normalizedId.replace(/\D/g, '').slice(-10);
    const query = isEmail ? { email: normalizedId } : { phone: { $regex: phoneDigits + '$' } };
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
      // Strong throwaway password — passwordless accounts authenticate via OTP and
      // never use this, but it's hashed and stored, so make it unguessable.
      password: crypto.randomBytes(18).toString('hex')
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
