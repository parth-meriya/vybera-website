import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './config';

export const submitContactQuery = async (data) => {
  const docRef = await addDoc(collection(db, 'supportQueries'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'pending' // pending, resolved
  });
  return docRef.id;
};

export const getSupportQueries = async () => {
  const q = query(collection(db, 'supportQueries'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateSupportQueryStatus = async (id, status) => {
  await updateDoc(doc(db, 'supportQueries', id), { status });
};

export const trackSupportQuery = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'supportQueries', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    return null;
  }
};
