const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const rateLimit = require('express-rate-limit');

// Specific rate limiter for Chat to prevent API abuse/cost spikes
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { message: "You're chatting fast! Please take a short break." }
});

router.post('/', chatLimiter, chatController.handleChat);

module.exports = router;
