const express = require('express');
const router = express.Router();
const axios = require('axios');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
const otpEmailTemplate = require('../utils/otpEmailTemplate');

/**
 * WhatsApp + Email Dual OTP System
 * 
 * Flow:
 * 1. User provides phone number + email
 * 2. Same 6-digit OTP is sent via WhatsApp AND Email simultaneously
 * 3. User can verify using the OTP received on either channel
 * 4. Single OTP record in DB — no duplication
 */

// POST /api/whatsapp-otp/send
router.post('/send', async (req, res) => {
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

    // 4a. WhatsApp Channel
    const whatsappUrl = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: "opt_code_template",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: generatedOtp },
              { type: "text", text: generatedOtp },
              { type: "text", text: generatedOtp }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: generatedOtp }]
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
        console.error(`❌ WhatsApp OTP failed for ${phoneNumber}:`, err.response?.data?.error?.message || err.message);
        return { channel: 'whatsapp', success: false };
      })
    );

    // 4b. Email Channel (if email provided)
    if (email) {
      sendPromises.push(
        sendEmail({
          email,
          subject: 'Your GPSFDK Verification Code',
          html: otpEmailTemplate('Customer', generatedOtp, true)
        })
        .then(() => {
          console.log(`✅ Email OTP sent to ${email}`);
          return { channel: 'email', success: true };
        })
        .catch((err) => {
          console.error(`❌ Email OTP failed for ${email}:`, err.message);
          return { channel: 'email', success: false };
        })
      );
    }

    // Wait for both channels to finish
    const results = await Promise.all(sendPromises);

    // Check if at least one channel succeeded
    const anySuccess = results.some(r => r.success);

    if (!anySuccess) {
      return res.status(500).json({ message: 'Failed to send OTP on all channels. Please try again.' });
    }

    // Build response showing which channels succeeded
    const channels = results.filter(r => r.success).map(r => r.channel);

    console.log(`📤 OTP sent successfully via: ${channels.join(', ')}`);

    res.status(200).json({
      success: true,
      message: `OTP sent via ${channels.join(' & ')}`,
      channels
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
router.post('/verify', async (req, res) => {
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
