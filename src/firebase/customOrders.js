/**
 * VYBERA — Custom Orders Firebase Module
 * Collection: customOrders
 */

import { db, storage } from './config';
import {
  collection, addDoc, getDocs, doc, updateDoc, getDoc,
  serverTimestamp, query, orderBy, where,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload custom design image to Firebase Storage.
 * @param {File} file - Image file from input
 * @param {string} userId
 * @param {Function} onProgress - Called with upload % progress (0-100)
 * @returns {Promise<string>} Download URL
 */
export const uploadCustomDesign = (file, userId, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(
      storage,
      `customDesigns/${userId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`
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
 * Save a completed custom order to Firestore.
 */
export const createCustomOrder = async (orderData) => {
  return addDoc(collection(db, 'customOrders'), {
    ...orderData,
    status: 'Pending',
    createdAt: serverTimestamp(),
  });
};

/**
 * Get all custom orders (admin).
 */
export const getAllCustomOrders = async () => {
  try {
    const q = query(collection(db, 'customOrders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};

/**
 * Get custom orders for a specific user.
 */
export const getCustomOrdersByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'customOrders'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return orders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch {
    return [];
  }
};

/**
 * Update a custom order's status.
 */
export const updateCustomOrderStatus = async (orderId, status) => {
  return updateDoc(doc(db, 'customOrders', orderId), { status, updatedAt: serverTimestamp() });
};

/**
 * Get a custom order by ID.
 */
export const getCustomOrderById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'customOrders', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch {
    return null;
  }
};
