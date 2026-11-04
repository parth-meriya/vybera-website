import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

/**
 * Returns the initialized Firebase Admin SDK instance.
 * Automatically checks local serviceAccountKey.json if present,
 * and falls back to sanitized environment variables on Vercel.
 */
export function getFirebaseAdmin() {
  if (admin.apps.length) {
    return admin;
  }

  // 1. Try local serviceAccountKey.json if present (local dev / test runs)
  try {
    const saPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(saPath)) {
      const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      if (sa.private_key && sa.client_email && sa.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(sa),
        });
        return admin;
      }
    }
  } catch (e) {
    console.warn('[FirebaseAdmin] Failed loading local serviceAccountKey.json:', e.message);
  }

  // 2. Fall back to environment variables (Vercel production)
  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL || '').trim();
  let privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY || '').trim();

  // Strip wrapping quotes if any
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }

  // Convert literal \n or Windows CRLF into real newlines
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials missing. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return admin;
}
