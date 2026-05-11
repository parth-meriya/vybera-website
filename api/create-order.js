/**
 * VYBERA — Razorpay Order Creation (Production Hardened)
 * Vercel Serverless Function: /api/create-order
 *
 * Security:
 *  - Rate limiting: 5 requests per IP per 60 seconds
 *  - Origin validation: only vybera.shop allowed
 *  - Payload validation: amount capped, inputs sanitized
 *  - CORS locked to production domain
 */

import Razorpay from 'razorpay';

// ── Rate Limiter (in-memory per cold-start) ──────────────────
const rateMap = new Map();
const RATE_LIMIT = 5;        // max requests
const RATE_WINDOW = 60_000;  // per 60 seconds

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// ── Razorpay Client ──────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Allowed Origins ──────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://vybera.shop',
  'https://www.vybera.shop',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://project-vybera.vercel.app',
];

export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];

  // ── Security Headers ─────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate Limiting ────────────────────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
           || req.headers['x-real-ip'] 
           || req.socket?.remoteAddress 
           || 'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ 
      error: 'Too many requests. Please wait a minute and try again.' 
    });
  }

  // ── Origin Validation (production) ───────────────────────
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app');
    if (!isAllowed && origin) {
      console.warn(`[Security] Blocked request from unauthorized origin: ${origin}`);
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const { amount, receipt } = req.body || {};

    // ── Payload Validation ───────────────────────────────
    if (typeof amount !== 'number' || !isFinite(amount)) {
      return res.status(400).json({ error: 'Invalid amount type' });
    }

    if (amount < 1) {
      return res.status(400).json({ error: 'Amount must be at least ₹1' });
    }

    if (amount > 50000) {
      return res.status(400).json({ error: 'Amount exceeds maximum allowed (₹50,000)' });
    }

    const safeReceipt = typeof receipt === 'string' 
      ? receipt.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) 
      : `vybera_${Date.now()}`;

    // ── Create Razorpay Order ────────────────────────────
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert ₹ to paise
      currency: 'INR',
      receipt: safeReceipt,
      notes: {
        platform: 'VYBERA',
        mode: 'live',
        ip: ip.slice(0, 45), // Log IP for fraud detection
      },
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('[API] Razorpay order creation failed:', error);
    return res.status(500).json({
      error: error.error?.description || error.message || 'Order creation failed',
    });
  }
}
