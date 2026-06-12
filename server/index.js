const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const connectDB = require('./config/db');
const { stripeWebhook } = require('./controllers/paymentController');

dotenv.config();

const app = express();

// ─── Trust proxy ───
// Render (and most PaaS) terminate TLS at a proxy. Without this, req.ip is the
// proxy's IP for every visitor, so express-rate-limit throttles ALL users as
// a single IP, and analytics/geo-pricing read the wrong source IP.
// `1` = trust the first proxy hop (Render's edge).
app.set('trust proxy', 1);

// ─── Security: Helmet (sets secure HTTP headers, API-friendly) ───
app.use(helmet({
  contentSecurityPolicy: false,            // Not needed for JSON APIs
  crossOriginEmbedderPolicy: false,        // Allow cross-origin API calls
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Let Vercel frontend read responses
}));

// Gzip-compress responses (big win for JSON product lists and the sitemap XML)
app.use(compression());

// ─── Security: Global rate limiter (500 req / 15 min per IP) ───
// Raised from 100 to 500 because admin product uploads with images
// generate many sub-requests (Cloudinary uploads) per product
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: (req) => {
    // Skip rate limiting for admin product upload routes
    // These routes are already protected by auth + admin middleware
    if (req.path.startsWith('/api/products') && ['POST', 'PUT'].includes(req.method)) return true;
    // Admin-only single-image upload: keep skipped (admin auth already gates abuse).
    // Public canvas upload is NOT skipped — it has its own per-IP route limiter.
    if (req.path === '/api/upload/' && req.method === 'POST') return true;
    if (req.path === '/api/upload' && req.method === 'POST') return true;
    // Skip rate limiting for Shiprocket webhook routes (now header-authenticated)
    if (req.path.startsWith('/api/webhook')) return true;
    return false;
  },
});
app.use(globalLimiter);

// Stripe webhook needs raw body — MUST be before express.json()
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ─── Shiprocket Webhook (mounted BEFORE CORS — server-to-server, no browser origin) ───
// Needs its own JSON parser since it's mounted before the global express.json()
app.use('/api/webhook', express.json(), require('./routes/shiprocketWebhook'));

// ─── Security: CORS ───
const allowedOrigins = [
  'http://localhost:5173',
  'https://gpsfdkrefresh.vercel.app',
  'https://gpsfdk.com',
  'https://www.gpsfdk.com',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or is a Vercel staging/preview/production subdomain
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.includes('localhost') || 
                      origin.includes('127.0.0.1');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} blocked by CORS`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

// ─── Body parsers ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Security: Sanitize MongoDB queries (prevent NoSQL injection) ───
// Inline sanitizer (express-mongo-sanitize is incompatible with Express 5)
const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  }
  return obj;
};
app.use((req, res, next) => {
  // Skip sanitization for Meta WhatsApp webhook — Meta sends dotted query keys
  // (hub.mode, hub.verify_token, hub.challenge) that the sanitizer would strip,
  // causing verification to fail. Webhook handlers never feed query into Mongo,
  // so the NoSQL-injection risk doesn't apply here.
  if (req.path.startsWith('/webhook')) return next();
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api', require('./routes/payments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/abandoned-carts', require('./routes/abandonedCarts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/marketing', require('./routes/marketing'));
app.use('/sitemap.xml', require('./routes/sitemap'));
app.use('/webhook', require('./routes/webhook'));
app.use('/api/whatsapp-otp', require('./routes/whatsappOtp'));
app.use('/api/pricing', require('./routes/pricing'));

// Root route
app.get('/', (req, res) => res.send('GPSFDK Ecommerce API is running 🚀'));

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'OK', 
  version: '1.3.0-security',
  timestamp: new Date().toISOString() 
}));

// ─── Catch-All 404 handler for Unknown Routes ───
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Route Not Found' });
});

// ─── Error handler (no info leaks in production) ───
app.use((err, req, res, next) => {
  // Handle Multer / file-upload errors explicitly
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.code, err.message);
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large. Maximum size is 5 MB.',
      LIMIT_FILE_COUNT: 'Too many files. Maximum is 10 images + 1 thumbnail.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
    };
    return res.status(400).json({ message: messages[err.code] || `Upload error: ${err.message}` });
  }

  // Handle Cloudinary / storage errors thrown during upload
  if (err.message && (err.message.includes('File type') || err.message.includes('not allowed') || err.message.includes('not supported'))) {
    console.error('Upload validation error:', err.message);
    return res.status(400).json({ message: err.message });
  }

  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';
  res.status(statusCode).json({ message });
});

const PORT = process.env.PORT || 5000;

// ─── Startup Environment Validation ─────────────────────────────────────────
// Surface missing tokens as clear warnings on boot so operators don't have
// to debug silent failures in production.
const validateEnv = () => {
  const warnings = [];
  const errors = [];

  // Critical — server won't function without these
  if (!process.env.MONGO_URI)    errors.push('MONGO_URI — database will not connect');
  if (!process.env.JWT_SECRET)   errors.push('JWT_SECRET — authentication will fail');

  // Payment gateway — Razorpay (detect placeholder keys too)
  const rzpPlaceholders = ['your_razorpay', 'placeholder', 'YOUR_'];
  const isRzpPlaceholder = (v) => !v || rzpPlaceholders.some((p) => v.includes(p));
  if (isRzpPlaceholder(process.env.RAZORPAY_KEY_ID))     errors.push('RAZORPAY_KEY_ID — Razorpay payments will fail (still set to placeholder)');
  if (isRzpPlaceholder(process.env.RAZORPAY_KEY_SECRET)) errors.push('RAZORPAY_KEY_SECRET — Razorpay payments will fail (still set to placeholder)');

  // OTP delivery — WhatsApp + email verification won't work
  if (!process.env.WHATSAPP_TOKEN)    warnings.push('WHATSAPP_TOKEN — WhatsApp OTP delivery disabled');
  if (!process.env.PHONE_NUMBER_ID)   warnings.push('PHONE_NUMBER_ID — WhatsApp OTP delivery disabled');

  // Meta Conversions API — server-side event tracking disabled
  if (!process.env.META_CAPI_ACCESS_TOKEN) warnings.push('META_CAPI_ACCESS_TOKEN — Meta CAPI event tracking disabled');

  // Admin seeding
  if (!process.env.ADMIN_EMAIL)    warnings.push('ADMIN_EMAIL — seed script will refuse to create admin');
  if (!process.env.ADMIN_PASSWORD) warnings.push('ADMIN_PASSWORD — seed script will refuse to create admin');

  if (errors.length > 0) {
    console.error('\n  MISSING CRITICAL ENV VARS:');
    errors.forEach(e => console.error(`    ${e}`));
  }
  if (warnings.length > 0) {
    console.warn('\n  MISSING ENV VARS (features degraded):');
    warnings.forEach(w => console.warn(`    ${w}`));
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log('  All environment variables configured');
  }
  console.log('');
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    validateEnv();
  });
});
