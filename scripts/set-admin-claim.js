/**
 * NEXVRA — Set Admin Custom Claim + Firestore Role
 *
 * This script:
 *   1. Finds the user by email in Firebase Auth
 *   2. Sets custom claim  { admin: true }  on their token
 *   3. Sets  role: 'admin'  in Firestore  users/{uid}
 *
 * HOW TO RUN:
 *   1. Go to Firebase Console → Project Settings → Service accounts tab
 *   2. Click  "Generate new private key"  → download the JSON file
 *   3. Save it as  serviceAccountKey.json  in the project root
 *   4. Run:  node scripts/set-admin-claim.js
 *
 * Security: serviceAccountKey.json is in .gitignore — NEVER commit it.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, '..', 'serviceAccountKey.json');

// ── CONFIG ─────────────────────────────────────────────────────
const TARGET_EMAIL = 'parthmeriya32@gmail.com';
// ───────────────────────────────────────────────────────────────

// Check service account key exists
if (!existsSync(KEY_PATH)) {
  console.error(`\n❌ Service account key not found at:\n   ${KEY_PATH}\n`);
  console.error(`Steps to get it:`);
  console.error(`  1. Open: https://console.firebase.google.com/project/nexvra-81837/settings/serviceaccounts/adminsdk`);
  console.error(`  2. Click "Generate new private key"`);
  console.error(`  3. Save the downloaded file as  serviceAccountKey.json  in the project root`);
  console.error(`  4. Run this script again\n`);
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

const run = async () => {
  try {
    console.log(`\n🔍 Looking up user: ${TARGET_EMAIL}`);

    // Get the user by email
    const user = await adminAuth.getUserByEmail(TARGET_EMAIL);
    const { uid, email, displayName } = user;
    console.log(`   Found: ${displayName || '(no name)'} — uid: ${uid}`);

    // ── 1. Set Firebase Custom Claim ─────────────────────────
    console.log(`\n🔑 Setting custom claim { admin: true } on token...`);
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`   ✅ Custom claim set!`);

    // ── 2. Update Firestore role ─────────────────────────────
    console.log(`\n🗄️  Updating Firestore users/${uid} → role: 'admin'...`);
    await adminDb.collection('users').doc(uid).set(
      { uid, email, name: displayName || 'Admin', role: 'admin' },
      { merge: true }
    );
    console.log(`   ✅ Firestore updated!`);

    // ── 3. Verify the claim was set ─────────────────────────
    const updatedUser = await adminAuth.getUser(uid);
    const claims = updatedUser.customClaims;
    console.log(`\n✅ Verification — custom claims on ${email}:`);
    console.log(`   `, JSON.stringify(claims, null, 2));

    console.log(`\n🎉 Done! ${email} is now an admin.`);
    console.log(`   Sign out and sign back in to refresh the token, then visit /admin\n`);

    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`\n❌ No Firebase user found with email: ${TARGET_EMAIL}`);
      console.error(`   Make sure this account is registered in your Firebase project first.\n`);
    } else {
      console.error(`\n❌ Error:`, err.message || err);
    }
    process.exit(1);
  }
};

run();
