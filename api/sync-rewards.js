import admin from 'firebase-admin';

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
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    initAdmin();
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(userId);

    let expiredCount = 0;
    let totalExpiredPoints = 0;

    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists) throw new Error('User document not found');

      const userData = userSnap.data();
      const currentPoints = userData.rewardPoints || 0;

      // Query active earn/adjustment records with remaining points
      const earnSnaps = await db.collection('rewardTransactions')
        .where('userId', '==', userId)
        .where('pointsRemaining', '>', 0)
        .get();

      const nowStr = new Date().toISOString();
      const expiredDocs = earnSnaps.docs
        .map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
        .filter(d => d.expiryDate && d.expiryDate < nowStr);

      if (expiredDocs.length > 0) {
        totalExpiredPoints = expiredDocs.reduce((acc, doc) => acc + doc.pointsRemaining, 0);
        expiredCount = expiredDocs.length;

        // Deduct points safely (never let balance go below 0)
        const newBalance = Math.max(0, currentPoints - totalExpiredPoints);
        transaction.update(userDocRef, {
          rewardPoints: newBalance
        });

        // Mark expired logs as 0 remaining
        for (const doc of expiredDocs) {
          transaction.update(doc.ref, { 
            pointsRemaining: 0, 
            expired: true,
            expiredAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Add transaction ledger log
        const expireTxRef = db.collection('rewardTransactions').doc();
        transaction.set(expireTxRef, {
          userId: userId,
          points: totalExpiredPoints,
          type: 'EXPIRE',
          description: `Loyalty points expired dynamically (FIFO rules)`,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: expiredCount > 0 ? `Successfully expired ${totalExpiredPoints} points across ${expiredCount} transactions.` : 'All reward points are currently active.'
    });
  } catch (error) {
    console.error('[Sync Rewards] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during points sync' });
  }
}
