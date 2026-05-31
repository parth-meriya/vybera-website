/**
 * VYBERA — Verify Payment API
 * Vercel Serverless Function: /api/verify-payment
 *
 * Security:
 *  - Cryptographically verifies Razorpay signature
 *  - Prevents fake payment success attacks
 *  - Uses Firebase Admin SDK to securely update the order in Firestore
 *    (Bypassing client-side rules, which now correctly block order modification)
 */

import crypto from 'crypto';
import admin from 'firebase-admin';
import Razorpay from 'razorpay';

// Lazy-initialize Firebase Admin SDK
function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY)?.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });
  }
}

const ALLOWED_ORIGINS = [
  'https://vybera.shop',
  'https://www.vybera.shop',
  'http://localhost:5173',
  'http://localhost:5174',
];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      firebase_order_id 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !firebase_order_id) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    // ── 1. Verify Razorpay Signature ────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('Server misconfiguration: RAZORPAY_KEY_SECRET is missing');
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error(`[Security] Payment signature mismatch for order ${firebase_order_id}`);
      return res.status(400).json({ error: 'Invalid payment signature. Payment rejected.' });
    }

    // ── 2. Update Firestore Order securely ──────────────────────
    initAdmin();
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(firebase_order_id);
    
    // Verify order exists
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      console.error(`[Payment] Order ${firebase_order_id} not found in Firestore`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = orderSnap.data();

    // ── 3. Verify Amount Paid with Razorpay ─────────────────────
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: secret,
    });

    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    const expectedAmountPaise = Math.round((orderData.total || 0) * 100);

    if (rzpOrder.amount !== expectedAmountPaise) {
      console.error(`[Security] Amount mismatch for order ${firebase_order_id}. Expected: ${expectedAmountPaise}, Paid: ${rzpOrder.amount}`);
      return res.status(400).json({ error: 'Payment amount mismatch. Payment rejected.' });
    }

    // ── 4. Process Rewards & Update Order (Atomic Transaction) ──
    const userId = orderData.userId;
    const pointsRedeemed = orderData.pointsRedeemed || 0;
    const couponCode = orderData.couponCode || null;

    await db.runTransaction(async (transaction) => {
      // If points were used, read the user doc first
      let userDocRef, userDocData;
      if (pointsRedeemed > 0) {
        userDocRef = db.collection('users').doc(userId);
        const userSnap = await transaction.get(userDocRef);
        if (!userSnap.exists) throw new Error('User not found for point deduction');
        userDocData = userSnap.data();

        if ((userDocData.rewardPoints || 0) < pointsRedeemed) {
          throw new Error('Insufficient reward points during checkout completion');
        }
      }

      // If coupon used, fetch the coupon document
      let couponDocRef;
      if (couponCode) {
        const couponsQuery = await db.collection('coupons').where('code', '==', couponCode).get();
        if (!couponsQuery.empty) {
          couponDocRef = couponsQuery.docs[0].ref;
        }
      }

      // Update Order Status
      transaction.update(orderRef, {
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        status: 'confirmed',
        paymentStatus: 'paid',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Mark single-use coupon as used, or increment usage
      if (couponDocRef) {
        const couponData = (await transaction.get(couponDocRef)).data();
        if (couponData.singleUse && !couponData.used) {
          transaction.update(couponDocRef, { used: true });
        } else if (!couponData.singleUse) {
          transaction.update(couponDocRef, { 
            timesUsed: admin.firestore.FieldValue.increment(1) 
          });
        }
      }

      // Deduct Points & Log Transaction
      if (pointsRedeemed > 0 && userDocRef) {
        transaction.update(userDocRef, {
          rewardPoints: admin.firestore.FieldValue.increment(-pointsRedeemed),
          totalRedeemedPoints: admin.firestore.FieldValue.increment(pointsRedeemed),
        });

        const txRef = db.collection('rewardTransactions').doc();
        transaction.set(txRef, {
          userId: userId,
          orderId: firebase_order_id,
          points: pointsRedeemed,
          type: 'REDEEM',
          description: `Redeemed points for order #${firebase_order_id.slice(0, 8)}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    console.log(`[Payment] Successfully verified and updated order ${firebase_order_id}`);

    return res.status(200).json({ success: true, message: 'Payment verified and order confirmed' });
  } catch (error) {
    console.error('[Payment Verification] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during verification' });
  }
}
