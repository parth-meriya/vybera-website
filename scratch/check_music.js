import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = 'd:/VYBERA/Project VYBERA/.env';
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkMusicConfig() {
  const snap = await getDoc(doc(db, 'settings', 'bannerConfig'));
  if (snap.exists()) {
    console.log('Current Admin Music Config:', JSON.stringify(snap.data(), null, 2));
  } else {
    console.log('No Admin Music Config found (Using local defaults).');
  }
}

checkMusicConfig().catch(console.error);
