/**
 * VYBERA — Sales / Campaigns Firebase Module
 * Collection: sales
 */

import { db, storage } from './config';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc,
  serverTimestamp, query, orderBy, where, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload sale banner media to Firebase Storage.
 */
export const uploadSaleBanner = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(
      storage,
      `saleBanners/${Date.now()}_${file.name.replace(/\s/g, '_')}`
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

/**
 * Create a new sale campaign.
 */
export const createSale = async (saleData) => {
  return addDoc(collection(db, 'sales'), {
    ...saleData,
    createdAt: serverTimestamp(),
  });
};

/**
 * Get all sale campaigns (admin).
 */
export const getAllSales = async () => {
  try {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};

/**
 * Get the currently active sale (for user-facing display).
 * Returns the first active sale whose date range includes now.
 */
export const getActiveSale = async () => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'sales'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const sales = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filter by date range client-side (Firestore doesn't support multi-field range)
    return sales.find(s => {
      const start = s.startDate?.toDate?.() || new Date(0);
      const end = s.endDate?.toDate?.() || new Date('2100-01-01');
      const nowDate = now.toDate();
      return nowDate >= start && nowDate <= end;
    }) || null;
  } catch {
    return null;
  }
};

/**
 * Update a sale campaign.
 */
export const updateSale = async (saleId, saleData) => {
  return updateDoc(doc(db, 'sales', saleId), {
    ...saleData,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete a sale campaign.
 */
export const deleteSale = async (saleId) => {
  return deleteDoc(doc(db, 'sales', saleId));
};

/**
 * Toggle a sale's active state.
 */
export const toggleSaleActive = async (saleId, isActive) => {
  return updateDoc(doc(db, 'sales', saleId), { isActive, updatedAt: serverTimestamp() });
};
