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

    // ── 1. Fetch Order from Firestore ─────────────────────────
    initAdmin();
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(firebase_order_id);
    
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      console.error(`[Payment] Order ${firebase_order_id} not found in Firestore`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = orderSnap.data();
    const isFreeOrder = (orderData.total || 0) === 0;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('Server misconfiguration: RAZORPAY_KEY_SECRET is missing');
    }

    // ── 2. Verify Razorpay Signature (only for paid orders) ─────
    if (!isFreeOrder) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.error(`[Security] Payment signature mismatch for order ${firebase_order_id}`);
        return res.status(400).json({ error: 'Invalid payment signature. Payment rejected.' });
      }

      // ── 3. Verify Amount Paid with Razorpay ───────────────────
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
    } else {
      // For free orders, verify that the bypass params are correct
      if (razorpay_order_id !== 'free_coupon_bypass' || razorpay_payment_id !== 'free_coupon_bypass') {
        return res.status(400).json({ error: 'Invalid parameters for free order bypass' });
      }
    }

    // ── 4. Process Rewards & Update Order (Atomic Transaction) ──
    const userId = orderData.userId;
    const pointsRedeemed = orderData.pointsRedeemed || 0;
    const couponCode = orderData.couponCode || null;

    await db.runTransaction(async (transaction) => {
      // Load global rewards settings
      const settingsSnap = await transaction.get(db.collection('settings').doc('rewards'));
      const settingsData = settingsSnap.exists ? settingsSnap.data() : { enabled: true, earningRate: 100, redemptionRate: 1, minPayable: 99 };

      // Calculate dynamically earned points
      let pointsEarned = 0;
      if (settingsData.enabled) {
        const qty = (orderData.products || []).reduce((acc, p) => acc + (p.quantity || 1), 0);
        pointsEarned = qty * (settingsData.earningRate || 100);
      }

      // If points were used or earned, fetch user document
      let userDocRef, userDocData;
      if (pointsRedeemed > 0 || pointsEarned > 0) {
        userDocRef = db.collection('users').doc(userId);
        const userSnap = await transaction.get(userDocRef);
        if (!userSnap.exists) throw new Error('User not found for points processing');
        userDocData = userSnap.data();
      }

      // Validation check for point redemption rules (Redeem controls)
      if (pointsRedeemed > 0) {
        if (!settingsData.enabled) {
          throw new Error('Reward points usage is currently disabled globally.');
        }
        if ((userDocData.rewardPoints || 0) < pointsRedeemed) {
          throw new Error('Insufficient reward points during checkout completion');
        }

        // Validate that total payable doesn't fall below minPayable rule
        const maxDiscountAllowed = Math.max(0, (orderData.total + (pointsRedeemed * settingsData.redemptionRate)) - settingsData.minPayable);
        const maxPointsAllowed = maxDiscountAllowed / settingsData.redemptionRate;
        if (pointsRedeemed > maxPointsAllowed) {
          throw new Error('Redeemed points exceed the checkout limits under minPayable rules.');
        }
      }

      // If coupon used, fetch and VALIDATE the coupon document server-side
      let couponDocRef;
      if (couponCode) {
        const couponsQuery = await db.collection('coupons').where('code', '==', couponCode).get();
        if (!couponsQuery.empty) {
          couponDocRef = couponsQuery.docs[0].ref;
          const couponData = (await transaction.get(couponDocRef)).data();
          
          // Security: Re-validate coupon server-side
          if (couponData.used) {
            throw new Error('This coupon has already been used.');
          }
          if (couponData.expiry && new Date(couponData.expiry) < new Date()) {
            throw new Error('This coupon has expired.');
          }
          // Prevent sharing: if coupon has a UID, it must match the order user
          if (couponData.uid && couponData.uid !== userId) {
            throw new Error('This coupon belongs to a different account and cannot be used.');
          }
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

      // Mark single-use coupon as used, or increment usage + add notification
      if (couponDocRef) {
        const couponData = (await transaction.get(couponDocRef)).data();
        if (couponData.singleUse && !couponData.used) {
          transaction.update(couponDocRef, { used: true, usedAt: admin.firestore.FieldValue.serverTimestamp() });
        } else if (!couponData.singleUse) {
          transaction.update(couponDocRef, { 
            timesUsed: admin.firestore.FieldValue.increment(1) 
          });
        }

        // Add notification to user about coupon usage
        const userNotifRef = db.collection('users').doc(userId);
        transaction.update(userNotifRef, {
          notifications: admin.firestore.FieldValue.arrayUnion({
            id: `notif_${Date.now()}_coupon_used`,
            type: 'coupon',
            title: 'Coupon Used Successfully',
            message: `Your coupon ${couponCode} (${couponData.type === 'percentage' ? couponData.value + '% OFF' : '₹' + couponData.value + ' OFF'}) was applied to order #${firebase_order_id.slice(0, 8)}.`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        });
      }

      // Apply Net User Wallet Points updates
      const netPointsChange = pointsEarned - pointsRedeemed;
      if (netPointsChange !== 0 && userDocRef) {
        transaction.update(userDocRef, {
          rewardPoints: admin.firestore.FieldValue.increment(netPointsChange),
          ...(pointsEarned > 0 ? { totalEarnedPoints: admin.firestore.FieldValue.increment(pointsEarned) } : {}),
          ...(pointsRedeemed > 0 ? { totalRedeemedPoints: admin.firestore.FieldValue.increment(pointsRedeemed) } : {}),
        });
      }

      // Write points transaction log (Earn)
      if (pointsEarned > 0) {
        const earnTxRef = db.collection('rewardTransactions').doc();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365); // expires in 365 days
        
        transaction.set(earnTxRef, {
          userId: userId,
          orderId: firebase_order_id,
          points: pointsEarned,
          pointsRemaining: pointsEarned,
          type: 'EARN',
          description: `Earned points for purchase in order #${firebase_order_id.slice(0, 8)}`,
          expiryDate: expiryDate.toISOString(),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Write points transaction log (Redeem) & Run FIFO remaining deduct logic
      if (pointsRedeemed > 0 && userDocRef) {
        const redeemTxRef = db.collection('rewardTransactions').doc();
        transaction.set(redeemTxRef, {
          userId: userId,
          orderId: firebase_order_id,
          points: pointsRedeemed,
          type: 'REDEEM',
          description: `Redeemed points for order #${firebase_order_id.slice(0, 8)}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // FIFO Deduction from pointsRemaining
        const earnSnaps = await db.collection('rewardTransactions')
          .where('userId', '==', userId)
          .where('pointsRemaining', '>', 0)
          .get();

        const activeEarnTxDocs = earnSnaps.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }))
          .sort((a, b) => {
            const aTime = a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime();
            const bTime = b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime();
            return aTime - bTime;
          });

        let remainingDeduction = pointsRedeemed;
        for (const doc of activeEarnTxDocs) {
          if (remainingDeduction <= 0) break;
          const avail = doc.pointsRemaining;
          if (avail <= remainingDeduction) {
            transaction.update(doc.ref, { pointsRemaining: 0 });
            remainingDeduction -= avail;
          } else {
            transaction.update(doc.ref, { pointsRemaining: avail - remainingDeduction });
            remainingDeduction = 0;
          }
        }
      }
    });

    console.log(`[Payment] Successfully verified and updated order ${firebase_order_id}`);

    return res.status(200).json({ success: true, message: 'Payment verified and order confirmed' });
  } catch (error) {
    console.error('[Payment Verification] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during verification' });
  }
}
