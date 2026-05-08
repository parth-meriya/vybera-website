import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const getAllUsers = async () => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (uid, data) => {
  return setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};
