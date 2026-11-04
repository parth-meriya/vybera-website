/**
 * VYBERA — Razorpay Serverless Callback Handler
 * Vercel Serverless Function: /api/razorpay-callback
 *
 * Razorpay Standard Checkout redirects user via HTTP POST
 * to this endpoint for redirect-based payment methods (UPI apps, NetBanking, 3D-Secure).
 *
 * This handler:
 * 1. Accepts POST / GET from Razorpay.
 * 2. Cryptographically verifies the payment and updates Firestore.
 * 3. Redirects the user via HTTP 303 (GET) to /order-success?foid=...
 */

import { verifyAndConfirmOrder } from './_lib/order-verifier.js';

export default async function handler(req, res) {
  // Support both POST (standard Razorpay redirect) and GET fallback
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = Object.fromEntries(new URLSearchParams(body));
    }
  }
  const query = req.query || {};

  const firebase_order_id = query.foid || body.foid || body.notes_firebase_order_id;
  const razorpay_order_id = body.razorpay_order_id || query.razorpay_order_id;
  const razorpay_payment_id = body.razorpay_payment_id || query.razorpay_payment_id;
  const razorpay_signature = body.razorpay_signature || query.razorpay_signature;

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'vybera.shop';
  const baseUrl = `${protocol}://${host}`;

  if (!firebase_order_id) {
    console.error('[Razorpay Callback] Missing firebase order ID (foid)');
    return res.redirect(303, `${baseUrl}/order-success?error=${encodeURIComponent('Missing order reference')}`);
  }

  // If Razorpay sent payment failed status in redirect body
  if (body.error_code || body.error_description) {
    console.warn('[Razorpay Callback] Payment failed at gateway:', body.error_description);
    return res.redirect(303, `${baseUrl}/checkout?error=${encodeURIComponent(body.error_description || 'Payment was unsuccessful')}`);
  }

  try {
    await verifyAndConfirmOrder({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      firebase_order_id,
    });

    console.log(`[Razorpay Callback] Successfully processed redirect payment for order ${firebase_order_id}`);
    return res.redirect(303, `${baseUrl}/order-success?foid=${encodeURIComponent(firebase_order_id)}`);
  } catch (error) {
    console.error(`[Razorpay Callback] Verification failed for order ${firebase_order_id}:`, error.message);
    return res.redirect(303, `${baseUrl}/order-success?foid=${encodeURIComponent(firebase_order_id)}&error=${encodeURIComponent(error.message)}`);
  }
}
