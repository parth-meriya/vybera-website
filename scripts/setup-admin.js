/**
 * NEXVRA — Admin Setup Script
 *
 * Run this ONCE to:
 * 1. Make a user an admin in Firestore
 * 2. Seed the database with sample products and coupons
 *
 * Usage:
 *   node scripts/setup-admin.js
 * 
 * Replace USER_EMAIL with your Firebase account email.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAJt__OJXQBjetNTfMZO9FSw_W-3zFxt0Y",
  authDomain: "nexvra-81837.firebaseapp.com",
  projectId: "nexvra-81837",
  storageBucket: "nexvra-81837.firebasestorage.app",
  messagingSenderId: "881446002031",
  appId: "1:881446002031:web:3455d2a9744066f9ad5c9a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ── CONFIG ─────────────────────────────────────
const ADMIN_EMAIL = 'YOUR_ADMIN_EMAIL@example.com';   // ← CHANGE THIS
const ADMIN_PASSWORD = 'YOUR_ADMIN_PASSWORD';           // ← CHANGE THIS
// ───────────────────────────────────────────────

const sampleProducts = [
  {
    name: 'NEXVRA Oversized Tee — Black',
    price: 1499,
    description: 'Premium oversized T-shirt with NEXVRA logo in white. 100% cotton. Made for the future.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    material: '100% Premium Cotton',
    fit: 'Oversized',
    featured: true,
    isDrop: false,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
  },
  {
    name: 'NEXVRA Oversized Tee — White',
    price: 1499,
    description: 'Clean white oversized tee with embroidered NEXVRA text. Heavyweight cotton.',
    sizes: ['S', 'M', 'L', 'XL'],
    material: '100% Premium Cotton',
    fit: 'Oversized',
    featured: true,
    isDrop: false,
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
  },
  {
    name: 'NEXVRA Drop 01 — Hoodie',
    price: 2999,
    description: 'Drop 01 exclusive. 380GSM French Terry fabric. Dropped shoulders. Limited run.',
    sizes: ['M', 'L', 'XL'],
    material: '380GSM French Terry',
    fit: 'Oversized',
    featured: true,
    isDrop: true,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15232d0?w=600&q=80',
  },
  {
    name: 'NEXVRA Cargo Jogger',
    price: 2499,
    description: 'Technical cargo jogger with side pockets and elastic ankles. Premium cotton blend.',
    sizes: ['S', 'M', 'L', 'XL'],
    material: '60% Cotton 40% Polyester',
    fit: 'Relaxed',
    featured: false,
    isDrop: true,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
  },
];

const sampleCoupons = [
  {
    code: 'NEXT10',
    type: 'percentage',
    value: 10,
    minOrder: 1000,
    maxDiscount: 200,
    expiry: '2026-12-31',
    active: true,
  },
  {
    code: 'NEXVRA20',
    type: 'percentage',
    value: 20,
    minOrder: 2000,
    maxDiscount: 500,
    expiry: '2026-12-31',
    active: true,
  },
  {
    code: 'FLAT150',
    type: 'flat',
    value: 150,
    minOrder: 1200,
    maxDiscount: null,
    expiry: '2026-06-30',
    active: true,
  },
];

const run = async () => {
  try {
    console.log('Signing in as admin...');
    const userCred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const uid = userCred.user.uid;

    console.log(`Setting role=admin for uid: ${uid}`);
    await setDoc(doc(db, 'users', uid), {
      uid,
      name: 'Admin',
      email: ADMIN_EMAIL,
      role: 'admin',
    }, { merge: true });
    console.log('✅ Admin role set!');

    console.log('\nSeeding products...');
    for (const product of sampleProducts) {
      const ref = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
      });
      console.log(`  ✅ Added: ${product.name} (${ref.id})`);
    }

    console.log('\nSeeding coupons...');
    for (const coupon of sampleCoupons) {
      const ref = await addDoc(collection(db, 'coupons'), {
        ...coupon,
        createdAt: serverTimestamp(),
      });
      console.log(`  ✅ Added: ${coupon.code} (${ref.id})`);
    }

    console.log('\nSeeding sale settings...');
    await setDoc(doc(db, 'settings', 'sale'), {
      active: false,
      percentage: 0,
      label: '',
    });
    console.log('  ✅ Sale settings initialized.');

    console.log('\nSeeding About content...');
    await setDoc(doc(db, 'content', 'about'), {
      text: `NEXVRA was born from a simple obsession: clothing that feels as forward-thinking as the people who wear it. We exist at the intersection of minimalism and futurism — crafting oversized silhouettes that transcend trend cycles.

Every piece in our collection is designed with intention. The weight of the fabric, the precision of the drop shoulder, the placement of every graphic — nothing is incidental. We make clothes for those who understand that what you wear is a conversation before you even speak.

Our drops are limited. Our standards are not. Each collection is produced in small batches to ensure quality and exclusivity. When a drop ends, it ends — no restocks, no compromises.

Wear the Next. Always.`,
    });
    console.log('  ✅ About content seeded.');

    console.log('\n🎉 Setup complete! You can now log into /admin');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
