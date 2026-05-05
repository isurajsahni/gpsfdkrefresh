const fs = require('fs');

const authControllerPath = 'd:\\gpsfdkrefresh\\server\\controllers\\authController.js';
let content = fs.readFileSync(authControllerPath, 'utf8');

const newCode = `
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
        subject: 'Your Login Code - GPSFDK',
        html: otpEmailTemplate('User', otp, false)
      });
      return res.json({ success: true, message: 'OTP sent via Email' });
    } else {
      if (channel === 'whatsapp' && process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID) {
        const whatsappPhone = normalizedId.replace(/\\D/g, '');
        const axios = require('axios');
        await axios.post(
          \`https://graph.facebook.com/v19.0/\${process.env.PHONE_NUMBER_ID}/messages\`,
          {
            messaging_product: 'whatsapp',
            to: whatsappPhone,
            type: 'template',
            template: {
              name: 'opt_code_template',
              language: { code: 'en_US' },
              components: [
                { type: 'body', parameters: [{ type: 'text', text: otp }, { type: 'text', text: otp }, { type: 'text', text: otp }] },
                { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] }
              ]
            }
          },
          { headers: { 'Authorization': \`Bearer \${process.env.WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' } }
        );
        return res.json({ success: true, message: 'OTP sent via WhatsApp' });
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
    const query = isEmail ? { email: normalizedId } : { phone: { $regex: normalizedId.replace(/\\D/g, ''), $options: 'i' } };
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
      \`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=\${apiKey}\`,
      { idToken }
    );

    const firebaseUser = response.data.users[0];
    if (!firebaseUser || !firebaseUser.phoneNumber) {
      return res.status(400).json({ message: 'Invalid Firebase token or no phone number found.' });
    }

    const phone = firebaseUser.phoneNumber;
    const phoneDigits = phone.replace(/\\D/g, '').slice(-10);
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
`;

if (!content.includes('PASSWORDLESS AUTHENTICATION')) {
  fs.writeFileSync(authControllerPath, content + '\n' + newCode);
  console.log('Added passwordless endpoints successfully.');
} else {
  console.log('Passwordless endpoints already exist.');
}
