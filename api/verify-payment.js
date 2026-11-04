/**
 * VYBERA — Verify Payment API
 * Vercel Serverless Function: /api/verify-payment
 *
 * Security:
 *  - Cryptographically verifies Razorpay signature
 *  - Verifies amount paid matches expected order total
 *  - Atomic transaction: Updates order status to 'confirmed' / 'paid'
 *  - Grants reward points & logs transactions
 */

import { verifyAndConfirmOrder } from './_lib/order-verifier.js';

const ALLOWED_ORIGINS = [
  'https://vybera.shop',
  'https://www.vybera.shop',
  'http://localhost:5173',
  'http://localhost:5174',
];

export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      firebase_order_id 
    } = req.body || {};

    const result = await verifyAndConfirmOrder({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      firebase_order_id,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Payment Verification] Error:', error);
    return res.status(error.message?.includes('Order not found') ? 404 : 400).json({ 
      error: error.message || 'Payment verification failed' 
    });
  }
}
