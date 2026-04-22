const express = require('express');
const router = express.Router();
const axios = require('axios');
const Otp = require('../models/Otp');

/**
 * Senior Engineer Note:
 * Using a dedicated model with MongoDB TTL index for automatic cleanup.
 * Added basic cooldown to prevent spam.
 */

// POST /api/whatsapp-otp/send
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ message: 'Invalid phone number format' });
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
      otp: generatedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // 4. Send via WhatsApp Cloud API
    const whatsappUrl = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: "otp_verification",
        language: {
          code: "en"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: generatedOtp
              }
            ]
          }
        ]
      }
    };

    console.log(`📤 Sending OTP to ${phoneNumber}...`);

    const response = await axios.post(whatsappUrl, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp API Response:', response.data);

    res.status(200).json({ success: true, message: 'OTP sent successfully' });

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

    // 1. Find the latest OTP for this number
    const otpRecord = await Otp.findOne({ phoneNumber, otp }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP or phone number' });
    }

    // 2. Check Expiry (Though MongoDB TTL usually handles this, we do it for extra safety)
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // 3. Success: Delete OTP so it can't be used again
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
