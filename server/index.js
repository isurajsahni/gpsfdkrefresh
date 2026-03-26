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
  const { Resend } = require('resend');
  const report = { env: {}, resend: null };

  report.env = {
    EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? `SET (${process.env.EMAIL_PASS.length} chars)` : 'NOT SET / EMPTY',
  };

  if (!process.env.EMAIL_PASS) {
    report.resend = 'SKIPPED - API key missing';
    return res.json(report);
  }

  const resend = new Resend(process.env.EMAIL_PASS);
  const senderEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const data = await resend.emails.send({
      from: `"GPSFDK" <${senderEmail}>`,
      to: 'isurajsahni7@gmail.com',
      subject: 'GPSFDK Deploy Test - HTTPS API',
      html: '<h2>Email from deployed server works via Resend HTTPS API!</h2>',
    });
    
    if (data.error) {
      report.resend = { status: 'FAILED', error: data.error };
    } else {
      report.resend = { status: 'OK', id: data.data?.id };
    }
  } catch (e) {
    report.resend = { status: 'CRASHED', error: e.message };
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
