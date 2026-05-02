import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './config';

export const getAllUsers = async () => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
