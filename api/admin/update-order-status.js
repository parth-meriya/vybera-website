/**
 * VYBERA — Secure Admin Order Status Update
 * Vercel Serverless Function: /api/admin/update-order-status
 *
 * Handles atomic granting and refunding of VYBERA Reward Points when order statuses change.
 */

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY)?.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
    }),
  });
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Verify admin role
    if (decodedToken.role !== 'admin' && decodedToken.admin !== true) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { orderId, newStatus, trackingId } = req.body;
    if (!orderId || !newStatus) {
      return res.status(400).json({ error: 'Missing orderId or newStatus' });
    }

    const db = admin.firestore();
    
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await transaction.get(orderRef);
      
      if (!orderSnap.exists) throw new Error('Order not found');
      const orderData = orderSnap.data();
      const oldStatus = orderData.status;
      
      // If status is not actually changing, just exit
      if (oldStatus === newStatus) return;

      const userId = orderData.userId;
      const userRef = db.collection('users').doc(userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error('User not found');
      const userData = userSnap.data();

      // Fetch Global Rewards Settings
      const settingsSnap = await transaction.get(db.collection('settings').doc('rewards'));
      const settings = settingsSnap.exists ? settingsSnap.data() : { enabled: true, earningRate: 100 };
      
      let pointChange = 0;
      let totalEarnedChange = 0;
      let totalRedeemedChange = 0;
      let txType = null;
      let description = '';

      // Rule: Grant points on 'delivered' (if not already granted)
      if (newStatus === 'delivered' && oldStatus !== 'delivered' && !orderData.rewardsGranted) {
        if (settings.enabled) {
          const productCount = orderData.products?.length || 1;
          const pointsEarned = productCount * (settings.earningRate || 100);
          
          pointChange += pointsEarned;
          totalEarnedChange += pointsEarned;
          txType = 'EARN';
          description = `Earned points for order #${orderId.slice(0, 8)}`;
          
          transaction.update(orderRef, { rewardsGranted: true, pointsEarned });
        }
      }

      // Rule: Revoke/Restore points on 'cancelled' or 'refunded'
      if ((newStatus === 'cancelled' || newStatus === 'refunded') && (oldStatus !== 'cancelled' && oldStatus !== 'refunded')) {
        
        // 1. If points were previously granted for this order, deduct them back
        if (orderData.rewardsGranted) {
          const earnedToRevoke = orderData.pointsEarned || 0;
          pointChange -= earnedToRevoke;
          // We don't usually reduce totalEarnedPoints to keep a high watermark, but we can if desired.
          // For now, we just deduct from current balance.
          txType = 'REFUND_DEDUCT';
          description = `Revoked earned points for returned order #${orderId.slice(0, 8)}`;
          
          transaction.update(orderRef, { rewardsGranted: false });
        }

        // 2. If points were REDEEMED to purchase this order, restore them to the user
        const pointsRedeemed = orderData.pointsRedeemed || 0;
        // We only restore if the order was paid/confirmed and actually deducted points.
        // If it was cancelled before payment, points were never deducted in verify-payment.
        if (pointsRedeemed > 0 && orderData.paymentStatus === 'paid' && !orderData.rewardsRestored) {
          pointChange += pointsRedeemed;
          // Refund decreases the totalRedeemedPoints
          totalRedeemedChange -= pointsRedeemed;
          txType = 'REFUND_RESTORE';
          description = `Restored redeemed points for cancelled order #${orderId.slice(0, 8)}`;
          
          transaction.update(orderRef, { rewardsRestored: true });
        }
      }

      // Apply User Updates if points changed
      if (pointChange !== 0 || totalRedeemedChange !== 0) {
        // Prevent negative balance
        const finalBalance = Math.max(0, (userData.rewardPoints || 0) + pointChange);
        
        transaction.update(userRef, {
          rewardPoints: finalBalance,
          ...(totalEarnedChange > 0 ? { totalEarnedPoints: admin.firestore.FieldValue.increment(totalEarnedChange) } : {}),
          ...(totalRedeemedChange !== 0 ? { totalRedeemedPoints: admin.firestore.FieldValue.increment(totalRedeemedChange) } : {})
        });

        // Log Transaction
        if (txType) {
          const txRef = db.collection('rewardTransactions').doc();
          transaction.set(txRef, {
            userId,
            orderId,
            points: Math.abs(pointChange),
            type: txType,
            description,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      // Always update order status
      const updatePayload = {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (trackingId !== undefined) updatePayload.trackingId = trackingId;
      
      transaction.update(orderRef, updatePayload);
    });

    return res.status(200).json({ success: true, message: `Order updated to ${newStatus}` });
  } catch (error) {
    console.error('[Admin] Update order status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update order' });
  }
}
