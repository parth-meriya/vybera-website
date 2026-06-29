import admin from 'firebase-admin';

// Lazy-initialize Firebase Admin SDK (singleton)
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

  // 1. Verify admin privilege
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.slice(7);
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Access denied: Requires admin privileges' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authorization token' });
  }

  try {
    const { targetUid, points, type, description } = req.body;
    const pts = parseInt(points);

    if (!targetUid || !pts || pts <= 0 || !type || !description) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    if (type !== 'MANUAL_ADD' && type !== 'MANUAL_DEDUCT') {
      return res.status(400).json({ error: 'Invalid adjustment type' });
    }

    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(targetUid);

    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists) throw new Error('User document not found');

      const userData = userSnap.data();
      const currentPoints = userData.rewardPoints || 0;

      if (type === 'MANUAL_ADD') {
        const newBalance = currentPoints + pts;
        
        transaction.update(userDocRef, {
          rewardPoints: newBalance,
          totalEarnedPoints: admin.firestore.FieldValue.increment(pts)
        });

        const earnTxRef = db.collection('rewardTransactions').doc();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365); // expires in 365 days

        transaction.set(earnTxRef, {
          userId: targetUid,
          points: pts,
          pointsRemaining: pts,
          type: 'MANUAL_ADD',
          description: description,
          expiryDate: expiryDate.toISOString(),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      } else { // MANUAL_DEDUCT
        const newBalance = Math.max(0, currentPoints - pts);
        const actualDeducted = currentPoints - newBalance;

        transaction.update(userDocRef, {
          rewardPoints: newBalance,
          totalRedeemedPoints: admin.firestore.FieldValue.increment(actualDeducted)
        });

        const deductTxRef = db.collection('rewardTransactions').doc();
        transaction.set(deductTxRef, {
          userId: targetUid,
          points: actualDeducted,
          type: 'MANUAL_DEDUCT',
          description: description,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // FIFO deduction on pointsRemaining
        if (actualDeducted > 0) {
          const earnSnaps = await db.collection('rewardTransactions')
            .where('userId', '==', targetUid)
            .where('pointsRemaining', '>', 0)
            .get();

          const activeEarnTxDocs = earnSnaps.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }))
            .sort((a, b) => {
              const aTime = a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime();
              const bTime = b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime();
              return aTime - bTime;
            });

          let remainingDeduction = actualDeducted;
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
      }
    });

    return res.status(200).json({ success: true, message: 'Points adjusted successfully' });
  } catch (error) {
    console.error('[Adjust Points API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during adjustment' });
  }
}
