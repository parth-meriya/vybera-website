/**
 * VYBERA — Admin: Set Custom Claims
 * Vercel Serverless Function: /api/admin/set-role
 *
 * Sets Firebase custom claims (admin: true/false) on a user.
 * This is the ONLY way to grant admin privileges — never trust the client.
 *
 * Security:
 *  - Caller must be authenticated with an existing admin custom claim
 *  - Firebase Admin SDK verifies the ID token server-side
 *  - No client-side role assignment possible
 *
 * Usage (from your backend console or a trusted admin script):
 *  POST /api/admin/set-role
 *  Authorization: Bearer <admin_firebase_id_token>
 *  { "targetUid": "...", "isAdmin": true }
 */

import admin from 'firebase-admin';

// Lazy-initialize Firebase Admin SDK (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace \\n escape in env vars
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://vybera.shop',
  'https://www.vybera.shop',
  'http://localhost:5173',
];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Verify caller is an authenticated admin ───────────────────
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.slice(7);
  let callerUid;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    callerUid = decoded.uid;

    // Verify the caller has admin custom claim
    if (!decoded.admin) {
      console.warn(`[Security] Non-admin user ${callerUid} attempted to set roles`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  } catch (err) {
    console.error('[Admin] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // ── Validate payload ──────────────────────────────────────────
  const { targetUid, isAdmin } = req.body || {};

  if (!targetUid || typeof targetUid !== 'string') {
    return res.status(400).json({ error: 'Invalid targetUid' });
  }

  if (typeof isAdmin !== 'boolean') {
    return res.status(400).json({ error: 'isAdmin must be a boolean' });
  }

  // Prevent self-modification
  if (targetUid === callerUid) {
    return res.status(400).json({ error: 'Cannot modify your own admin status' });
  }

  try {
    // Set Firebase custom claim
    await admin.auth().setCustomUserClaims(targetUid, { admin: isAdmin });

    // Also update Firestore role field for consistency
    const userRef = admin.firestore().doc(`users/${targetUid}`);
    await userRef.set(
      { role: isAdmin ? 'admin' : 'user', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    console.log(`[Admin] ${callerUid} set admin=${isAdmin} for user ${targetUid}`);

    return res.status(200).json({
      success: true,
      message: `User ${targetUid} is now ${isAdmin ? 'an admin' : 'a regular user'}.`,
    });
  } catch (err) {
    console.error('[Admin] setCustomUserClaims failed:', err.message);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
}
