import crypto from 'crypto';
import { getFirebaseAdmin } from './firebase-admin.js';
import { getRazorpayClient, getRazorpaySecret } from './razorpay.js';
import { dispatchNotification } from './notification-dispatcher.js';

/**
 * Core cryptographic verification and atomic order confirmation logic.
 * Shared between /api/verify-payment (JSON API) and /api/razorpay-callback (Redirect handler).
 */
export async function verifyAndConfirmOrder({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  firebase_order_id,
}) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !firebase_order_id) {
    throw new Error('Missing payment verification parameters');
  }

  const admin = getFirebaseAdmin();
  const db = admin.firestore();
  const orderRef = db.collection('orders').doc(firebase_order_id);

  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error('Order not found in database');
  }

  const orderData = orderSnap.data();

  // Idempotency: if order is already confirmed and paid, return early with success
  if (orderData.status === 'confirmed' && orderData.paymentStatus === 'paid') {
    return { success: true, message: 'Order already confirmed', orderData };
  }

  const isFreeOrder = (orderData.total || 0) === 0;
  const secret = getRazorpaySecret();
  if (!secret) {
    throw new Error('Server misconfiguration: RAZORPAY_KEY_SECRET is missing');
  }

  // 1. Verify Razorpay cryptographic signature
  if (!isFreeOrder) {
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error(`[Security] Payment signature mismatch for order ${firebase_order_id}`);
      throw new Error('Invalid payment signature. Payment rejected.');
    }

    // 2. Verify amount paid with Razorpay
    const razorpay = getRazorpayClient();
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    const expectedAmountPaise = Math.round((orderData.total || 0) * 100);

    if (rzpOrder.amount !== expectedAmountPaise) {
      console.error(`[Security] Amount mismatch for order ${firebase_order_id}. Expected: ${expectedAmountPaise}, Paid: ${rzpOrder.amount}`);
      throw new Error('Payment amount mismatch. Payment rejected.');
    }
  } else {
    if (razorpay_order_id !== 'free_coupon_bypass' || razorpay_payment_id !== 'free_coupon_bypass') {
      throw new Error('Invalid parameters for free order bypass');
    }
  }

  // 3. Process Rewards & Update Order (Atomic Transaction)
  // CRITICAL RULE: In Firestore transactions, ALL READS MUST HAPPEN BEFORE ANY WRITES!
  const userId = orderData.userId;
  const pointsRedeemed = Number(orderData.pointsRedeemed || 0);
  const couponCode = orderData.couponCode || null;

  await db.runTransaction(async (transaction) => {
    // ── READ 1: Rewards settings ──
    const settingsSnap = await transaction.get(db.collection('settings').doc('rewards'));
    const settingsData = settingsSnap.exists ? settingsSnap.data() : { enabled: true, earningRate: 100, redemptionRate: 1, minPayable: 99 };

    // ── READ 2: User document (if user exists and points are involved) ──
    let userDocRef = null;
    let userDocData = null;
    if (userId) {
      userDocRef = db.collection('users').doc(userId);
      const userSnap = await transaction.get(userDocRef);
      if (userSnap.exists) {
        userDocData = userSnap.data();
      }
    }

    // ── READ 3: Coupon document (if coupon code was used) ──
    let couponDocRef = null;
    let couponData = null;
    if (couponCode) {
      const couponsQuery = await db.collection('coupons').where('code', '==', couponCode).get();
      if (!couponsQuery.empty) {
        couponDocRef = couponsQuery.docs[0].ref;
        const cSnap = await transaction.get(couponDocRef);
        if (cSnap.exists) {
          couponData = cSnap.data();
        }
      }
    }

    // ── READ 4: Reward transactions for FIFO deduction (if points redeemed) ──
    let activeEarnTxDocs = [];
    if (pointsRedeemed > 0 && userDocRef) {
      const earnSnaps = await db.collection('rewardTransactions')
        .where('userId', '==', userId)
        .where('pointsRemaining', '>', 0)
        .get();

      activeEarnTxDocs = earnSnaps.docs
        .map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.timestamp?.toMillis?.() || new Date(a.timestamp || 0).getTime();
          const bTime = b.timestamp?.toMillis?.() || new Date(b.timestamp || 0).getTime();
          return aTime - bTime;
        });
    }

    // ─────────────────────────────────────────────────────────────
    // ── ALL READS ARE COMPLETE. NOW PERFORM VALIDATION & WRITES ──
    // ─────────────────────────────────────────────────────────────

    // Validate points redemption
    if (pointsRedeemed > 0 && userDocData) {
      if (!settingsData.enabled) {
        throw new Error('Reward points usage is currently disabled.');
      }
      if ((userDocData.rewardPoints || 0) < pointsRedeemed) {
        throw new Error('Insufficient reward points.');
      }
    }

    // Calculate dynamically earned points
    let pointsEarned = 0;
    if (settingsData.enabled) {
      const qty = (orderData.products || []).reduce((acc, p) => acc + (p.quantity || 1), 0);
      pointsEarned = qty * (settingsData.earningRate || 100);
    }

    // ── WRITE 1: Confirm Order in Firestore ──
    transaction.update(orderRef, {
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      status: 'confirmed',
      paymentStatus: 'paid',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ── WRITE 2: Mark coupon as used or increment usage ──
    if (couponDocRef && couponData) {
      if (couponData.singleUse && !couponData.used) {
        transaction.update(couponDocRef, {
          used: true,
          usedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (!couponData.singleUse) {
        transaction.update(couponDocRef, {
          timesUsed: admin.firestore.FieldValue.increment(1)
        });
      }
    }

    // ── WRITE 3: Update user points balance in wallet ──
    const netPointsChange = pointsEarned - pointsRedeemed;
    if (netPointsChange !== 0 && userDocRef && userDocData) {
      transaction.update(userDocRef, {
        rewardPoints: admin.firestore.FieldValue.increment(netPointsChange),
        ...(pointsEarned > 0 ? { totalEarnedPoints: admin.firestore.FieldValue.increment(pointsEarned) } : {}),
        ...(pointsRedeemed > 0 ? { totalRedeemedPoints: admin.firestore.FieldValue.increment(pointsRedeemed) } : {}),
      });
    }

    // ── WRITE 4: Create earned points transaction record ──
    if (pointsEarned > 0) {
      const earnTxRef = db.collection('rewardTransactions').doc();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 365);
      transaction.set(earnTxRef, {
        userId: userId,
        orderId: firebase_order_id,
        points: pointsEarned,
        pointsRemaining: pointsEarned,
        type: 'EARN',
        description: `Earned points for order #${firebase_order_id.slice(0, 8)}`,
        expiryDate: expiryDate.toISOString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ── WRITE 5: Create redeemed points transaction record & update FIFO ──
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

      let remainingDeduction = pointsRedeemed;
      for (const doc of activeEarnTxDocs) {
        if (remainingDeduction <= 0) break;
        const avail = doc.pointsRemaining || 0;
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

  console.log(`[Payment] Successfully confirmed order ${firebase_order_id}`);

  // 4. Post-transaction notifications (non-blocking)
  try {
    if (userId) {
      await dispatchNotification(db, {
        userId: userId,
        type: 'order',
        title: 'Order Confirmed',
        message: `Your order #${firebase_order_id.slice(0, 8)} of ₹${(orderData.total || 0).toLocaleString()} has been confirmed! We will update you when it ships.`
      });
    }
  } catch (notifErr) {
    console.error('[Payment] Notification dispatch failed:', notifErr.message);
  }

  // 5. Custom products handling (non-blocking)
  try {
    const customProducts = (orderData.products || []).filter(p => p.isCustom);
    if (customProducts.length > 0) {
      const batch = db.batch();
      for (const product of customProducts) {
        const customOrderRef = db.collection('customOrders').doc();
        batch.set(customOrderRef, {
          orderId: firebase_order_id,
          userId: userId,
          userEmail: orderData.userEmail || null,
          customerName: orderData.customerName || '',
          customerPhone: orderData.customerPhone || '',
          productName: product.name || 'Custom T-Shirt',
          size: product.size || 'N/A',
          selectedColor: product.selectedColor || null,
          fit: product.fit || null,
          position: product.position || null,
          imageUrls: product.imageUrls || [],
          description: product.description || '',
          designStatus: product.designStatus || 'Received',
          customizationParams: product.customizationParams || null,
          quantity: product.quantity || 1,
          price: product.price || 0,
          status: 'Pending',
          address: orderData.address || {},
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (customErr) {
    console.error('[Payment] Custom orders creation failed:', customErr.message);
  }

  return { success: true, message: 'Payment verified and order confirmed', orderData };
}
