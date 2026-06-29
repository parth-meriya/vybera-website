import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'sizeGuides';

export const getSizeGuides = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching size guides:', error);
    return [];
  }
};

export const getSizeGuideById = async (id) => {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching size guide by ID:', error);
    return null;
  }
};

export const saveSizeGuide = async (id, data) => {
  try {
    const docRef = id ? doc(db, COLLECTION_NAME, id) : doc(collection(db, COLLECTION_NAME));
    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp(),
    };
    await setDoc(docRef, payload, { merge: true });
    return docRef.id;
  } catch (error) {
    console.error('Error saving size guide:', error);
    throw error;
  }
};

export const deleteSizeGuide = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting size guide:', error);
    throw error;
  }
};
