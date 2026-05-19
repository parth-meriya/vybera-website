/**
 * VYBERA — Production API Server
 *
 * Prepared for deployment on Render.
 * Provides backend services like Razorpay order creation.
 */

import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env manually (Vite handles this for the frontend, but Node needs it separately)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  });
} catch {
  console.warn('Could not read .env file');
}

const app = express();

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://vybera.shop',
  'https://www.vybera.shop',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

// CORS setup for production
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    console.log(`[Razorpay] Creating order: ₹${amount}`);

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // ₹ → paise
      currency: 'INR',
      receipt: receipt || `vybera_${Date.now()}`,
      notes: { platform: 'VYBERA', environment: process.env.NODE_ENV || 'production' },
    });

    console.log(`[Razorpay] Order created: ${order.id}`);
    return res.json({ id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt });
  } catch (error) {
    console.error('[Razorpay] Error:', error.error?.description || error.message);
    return res.status(500).json({ error: error.error?.description || error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VYBERA Production API' }));

// ── Server-Side Validation Helpers ──────────────────────────────
const NAME_REGEX = /^[A-Za-z ]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateServerInputs = (data) => {
  const errors = [];
  const { name, email, phone, password } = data;

  // Name validation
  if (name !== undefined) {
    const trimName = (name || '').trim();
    if (!trimName) errors.push('Name is required');
    else if (!NAME_REGEX.test(trimName)) errors.push('Name can contain only letters');
    else if (trimName.length < 2) errors.push('Name must be at least 2 characters');
  }

  // Email validation
  if (email !== undefined) {
    const trimEmail = (email || '').trim();
    if (!trimEmail || !EMAIL_REGEX.test(trimEmail)) errors.push('Valid email required');
  }

  // Phone validation (Indian mobile)
  if (phone !== undefined) {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) errors.push('Mobile number is required');
    else if (!PHONE_REGEX.test(digits)) errors.push('Enter a valid Indian mobile number (10 digits, starts with 6-9)');
  }

  // Password validation
  if (password !== undefined) {
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password needs an uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password needs a lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password needs a number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push('Password needs a special character');
    if (email && password.toLowerCase() === email.toLowerCase()) errors.push('Password cannot be same as email');
  }

  return errors;
};

// Input sanitizer middleware
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/[<>]/g, '').replace(/javascript:/gi, '');
      }
    }
  }
  next();
};

app.use(sanitizeBody);

// ── Validate Signup Data (server-side check) ────────────────────
app.post('/api/validate-signup', (req, res) => {
  const errors = validateServerInputs(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ valid: false, errors });
  }
  return res.json({ valid: true });
});

// ── Validate Order Contact (server-side check) ──────────────────
app.post('/api/validate-order-contact', (req, res) => {
  const { name, email, phone } = req.body;
  const errors = validateServerInputs({ name, email, phone });
  if (errors.length > 0) {
    return res.status(400).json({ valid: false, errors });
  }
  return res.json({ valid: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 VYBERA API Server running on port ${PORT}`);
  console.log(`   Health Check: GET /api/health`);
  console.log(`   Razorpay: POST /api/create-order`);
  console.log(`   Validation: POST /api/validate-signup`);
  console.log(`   Validation: POST /api/validate-order-contact\n`);
});
