import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export const createOrder = async (orderData) => {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: orderData.status || 'confirmed',
    paymentStatus: orderData.paymentStatus || 'paid',
    trackingId: orderData.trackingId || '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getOrdersByUser = async (userId) => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return orders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
};

export const getAllOrders = async () => {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getOrderById = async (id) => {
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const updateOrderStatus = async (id, status) => {
  await updateDoc(doc(db, 'orders', id), { status });
};

export const updateOrderTracking = async (id, status, trackingId) => {
  await updateDoc(doc(db, 'orders', id), { 
    status,
    trackingId: trackingId || '' 
  });
};
