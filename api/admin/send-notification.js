import admin from 'firebase-admin';
import { dispatchNotification } from '../_lib/notification-dispatcher';

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
    const { targetUid, type, title, message } = req.body;
    if (!targetUid || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const db = admin.firestore();

    if (targetUid === 'all') {
      // Broadcast to all users
      const usersSnap = await db.collection('users').get();
      if (usersSnap.empty) {
        return res.status(200).json({ success: true, message: 'No users found to broadcast to.' });
      }

      const dispatchPromises = usersSnap.docs.map(doc => 
        dispatchNotification(db, {
          userId: doc.id,
          type,
          title,
          message
        })
      );

      await Promise.all(dispatchPromises);
      return res.status(200).json({ 
        success: true, 
        message: `Successfully broadcasted notification to ${usersSnap.size} users.` 
      });

    } else {
      // Targeted notification
      const success = await dispatchNotification(db, {
        userId: targetUid,
        type,
        title,
        message
      });

      if (!success) {
        return res.status(404).json({ error: 'User not found or failed to dispatch notification.' });
      }

      return res.status(200).json({ success: true, message: 'Notification dispatched successfully.' });
    }
  } catch (error) {
    console.error('[Send Notification API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during notification dispatch' });
  }
}
