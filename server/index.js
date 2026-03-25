const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { stripeWebhook } = require('./controllers/paymentController');

dotenv.config();

const app = express();

// Stripe webhook needs raw body
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://gpsfdkrefresh.vercel.app', process.env.CLIENT_URL].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/analytics', require('./routes/analytics'));

// Root route
app.get('/', (req, res) => res.send('GPSFDK Ecommerce API is running 🚀'));

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'OK', 
  version: '1.2.0-csv-fix',
  timestamp: new Date().toISOString() 
}));

// TEMPORARY: Email diagnostic endpoint (remove after debugging)
app.get('/api/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  const report = { env: {}, smtp: null, send: null };

  report.env = {
    EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
    EMAIL_PORT: process.env.EMAIL_PORT || 'NOT SET',
    EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? `SET (${process.env.EMAIL_PASS.length} chars)` : 'NOT SET / EMPTY',
  };

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    report.smtp = 'SKIPPED - credentials missing';
    return res.json(report);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 15000,
  });

  try {
    await transporter.verify();
    report.smtp = 'OK - connected and authenticated';
  } catch (e) {
    report.smtp = `FAILED: ${e.message} (code: ${e.code})`;
    return res.json(report);
  }

  try {
    const info = await transporter.sendMail({
      from: `"GPSFDK" <${process.env.EMAIL_USER}>`,
      to: 'isurajsahni7@gmail.com',
      subject: 'GPSFDK Deploy Test - ' + new Date().toLocaleTimeString(),
      html: '<h2>Email from deployed server works!</h2><p>Sent at: ' + new Date().toISOString() + '</p>',
    });
    report.send = { status: 'OK', messageId: info.messageId, response: info.response };
  } catch (e) {
    report.send = { status: 'FAILED', error: e.message };
  }

  res.json(report);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
