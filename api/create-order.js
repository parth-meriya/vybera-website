/**
 * VYBERA — Razorpay Order Creation (Production Hardened)
 * Vercel Serverless Function: /api/create-order
 *
 * Security:
 *  - Rate limiting: 10 requests per IP per 60 seconds
 *  - Origin validation: allowed origins or vercel.app
 *  - Token verification via Firebase Admin SDK
 *  - Order verification via Firestore
 *  - Amount and rewards limits validation
 */

import { getFirebaseAdmin } from './_lib/firebase-admin.js';
import { getRazorpayClient } from './_lib/razorpay.js';

// ── Rate Limiter (in-memory per cold-start instance) ──────────
const rateMap = new Map();
const RATE_LIMIT = 10;       // max requests
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

  // ── Security & CORS Headers ──────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
      error: 'Too many payment requests. Please wait a minute and try again.' 
    });
  }

  // ── Origin Validation ────────────────────────────────────
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app');
    if (!isAllowed && origin) {
      console.warn(`[Security] Blocked request from unauthorized origin: ${origin}`);
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const { orderId, idToken, receipt } = req.body || {};

    if (!orderId || !idToken) {
      return res.status(400).json({ error: 'Missing orderId or authentication token.' });
    }

    // ── 1. Initialize Services ───────────────────────────
    const admin = getFirebaseAdmin();
    const razorpay = getRazorpayClient();

    // ── 2. Verify User Token ─────────────────────────────
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (authErr) {
      console.error('[API] Token verification failed:', authErr.message);
      return res.status(401).json({ error: 'Authentication expired. Please sign in again.' });
    }
    const uid = decodedToken.uid;

    // ── 3. Fetch Order from Firestore ────────────────────
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found in database.' });
    }

    const orderData = orderSnap.data();

    if (orderData.userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized to process this order.' });
    }
    
    if (orderData.paymentStatus === 'paid' || orderData.status === 'confirmed') {
      return res.status(400).json({ error: 'Order has already been paid and processed.' });
    }

    const amount = Number(orderData.total);
    const pointsRedeemed = Number(orderData.pointsRedeemed || 0);

    // ── 4. Validate Amount & Rewards ─────────────────────
    if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount.' });
    }

    // Check minimum payable amount
    if (pointsRedeemed > 0) {
      const settingsSnap = await db.collection('settings').doc('rewards').get();
      const settings = settingsSnap.exists ? settingsSnap.data() : { enabled: true, minPayable: 99 };
      
      if (!settings.enabled) {
        return res.status(400).json({ error: 'Rewards redemption is currently disabled.' });
      }

      const minPayable = settings.minPayable || 99;
      if (amount < minPayable) {
        return res.status(400).json({ error: `When redeeming reward points, payable amount must be at least ₹${minPayable}.` });
      }

      const userSnap = await db.collection('users').doc(uid).get();
      const userData = userSnap.exists ? userSnap.data() : {};
      const userPoints = userData.rewardPoints || 0;

      if (userPoints < pointsRedeemed) {
        return res.status(400).json({ error: 'Insufficient reward points in your account.' });
      }
    } else {
      // Standard order minimum for Razorpay is ₹1
      if (amount < 1) {
        return res.status(400).json({ error: 'Order amount must be at least ₹1.' });
      }
    }

    if (amount > 100000) {
      return res.status(400).json({ error: 'Amount exceeds maximum checkout limit (₹1,00,000).' });
    }

    // Razorpay receipt length MUST be <= 40 characters
    const safeReceipt = (typeof receipt === 'string' && receipt.trim())
      ? receipt.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
      : `vy_${orderId.slice(0, 20)}_${Date.now().toString().slice(-8)}`;

    // ── 5. Create Razorpay Order ────────────────────────────
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert ₹ to paise
      currency: 'INR',
      receipt: safeReceipt,
      notes: {
        orderId: orderId,
        uid: uid,
        ip: ip.slice(0, 45),
      },
    });

    return res.status(200).json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
    });
  } catch (error) {
    console.error('[API] Razorpay order creation failed:', error);
    const message = error.error?.description || error.description || error.message || 'Order creation failed on payment server.';
    return res.status(500).json({ error: message });
  }
}
