import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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

async function checkCustomOrder() {
  const email = 'chauhanrinku1999@gmail.com';
  console.log(`Searching for CUSTOM orders with email: ${email}...`);
  
  const q = query(collection(db, 'customOrders'), where('email', '==', email));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    console.log('No custom orders found.');
  } else {
    console.log(`Found ${snap.docs.length} custom orders!`);
    snap.docs.forEach(d => console.log(JSON.stringify({id: d.id, ...d.data()}, null, 2)));
  }
}

checkCustomOrder().catch(console.error);
