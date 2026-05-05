import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env from the project
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

async function checkOrder() {
  const email = 'chauhanrinku1999@gmail.com';
  console.log(`Searching for orders with email: ${email}...`);
  
  const q = query(collection(db, 'orders'), where('userEmail', '==', email));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    console.log('No orders found with that email.');
    
    // Try searching in address.email
    console.log('Searching in address.email...');
    const q2 = query(collection(db, 'orders'), where('address.email', '==', email));
    const snap2 = await getDocs(q2);
    
    if (snap2.empty) {
      console.log('STILL NO ORDERS FOUND.');
    } else {
      console.log(`Found ${snap2.docs.length} orders in address.email!`);
      snap2.docs.forEach(d => console.log(JSON.stringify({id: d.id, ...d.data()}, null, 2)));
    }
  } else {
    console.log(`Found ${snap.docs.length} orders!`);
    snap.docs.forEach(d => console.log(JSON.stringify({id: d.id, ...d.data()}, null, 2)));
  }
}

checkOrder().catch(console.error);
