/**
 * VYBERA — Bootstrap Admin User
 * ═══════════════════════════════════════════════════════════════
 *
 * Run this script ONCE to promote your account to admin.
 * It uses the Firebase Admin SDK with serviceAccountKey.json.
 *
 * Prerequisites:
 *   1. Ensure serviceAccountKey.json is in the project root
 *   2. Never commit serviceAccountKey.json to Git
 *
 * Usage:
 *   node scripts/bootstrap-admin.js <firebase-user-uid>
 *
 * To find your UID:
 *   Firebase Console → Authentication → Users → copy the UID
 *
 * Example:
 *   node scripts/bootstrap-admin.js abc123uid456
 * ═══════════════════════════════════════════════════════════════
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account key
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
  );
} catch {
  console.error('❌ serviceAccountKey.json not found in project root.');
  console.error('   Download it from: Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const targetUid = process.argv[2];

if (!targetUid) {
  console.error('❌ No UID provided.');
  console.error('   Usage: node scripts/bootstrap-admin.js <firebase-user-uid>');
  process.exit(1);
}

async function bootstrapAdmin() {
  try {
    // Verify the user exists
    const userRecord = await admin.auth().getUser(targetUid);
    console.log(`\n📋 Found user: ${userRecord.email} (${userRecord.uid})`);

    // Set custom claim
    await admin.auth().setCustomUserClaims(targetUid, { admin: true });
    console.log('✅ Custom claim { admin: true } set on Firebase Auth token');

    // Update Firestore role
    await admin.firestore().doc(`users/${targetUid}`).set(
      {
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log('✅ Firestore users/{uid}/role = "admin" updated');

    console.log('\n🎉 Admin bootstrap complete!');
    console.log('   The user must sign out and sign back in for the new token to take effect.');
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   UID:   ${userRecord.uid}\n`);
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

bootstrapAdmin();
