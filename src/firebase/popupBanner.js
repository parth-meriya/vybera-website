/**
 * VYBERA — Popup Banner Firebase Service
 *
 * Handles CRUD for the popupBanner collection + optimized image uploads
 * to Firebase Storage with progress tracking.
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

const COLLECTION = 'popupBanner';

// ── Get Active Popup (for frontend display) ───────────────────
export const getActivePopup = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error('[PopupBanner] Failed to fetch active popup:', err);
    return null;
  }
};

// ── Get All Popups (for admin) ────────────────────────────────
export const getAllPopups = async () => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Upload Banner Image (optimized with progress) ─────────────
export const uploadPopupImage = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const filename = `popup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
    const storageRef = ref(storage, `popup-banners/${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('[PopupBanner] Upload failed:', error);
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

// ── Create Popup ──────────────────────────────────────────────
export const createPopup = async (data, imageFile, onProgress) => {
  let imageUrl = data.imageUrl || '';

  if (imageFile) {
    imageUrl = await uploadPopupImage(imageFile, onProgress);
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    imageUrl,
    title: data.title || '',
    buttonText: data.buttonText || '',
    buttonLink: data.buttonLink || '',
    isActive: data.isActive ?? true,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

// ── Update Popup ──────────────────────────────────────────────
export const updatePopup = async (id, data, imageFile, onProgress) => {
  const updates = {
    title: data.title || '',
    buttonText: data.buttonText || '',
    buttonLink: data.buttonLink || '',
    isActive: data.isActive ?? true,
    updatedAt: serverTimestamp(),
  };

  if (imageFile) {
    // Delete old image if it exists in Firebase Storage
    if (data.oldImageUrl && data.oldImageUrl.includes('firebase')) {
      try {
        const oldRef = ref(storage, data.oldImageUrl);
        await deleteObject(oldRef).catch(() => {});
      } catch { /* ignore */ }
    }
    updates.imageUrl = await uploadPopupImage(imageFile, onProgress);
  } else if (data.imageUrl !== undefined) {
    updates.imageUrl = data.imageUrl;
  }

  await updateDoc(doc(db, COLLECTION, id), updates);
};

// ── Toggle Active Status ──────────────────────────────────────
export const togglePopupActive = async (id, isActive) => {
  await updateDoc(doc(db, COLLECTION, id), { isActive });
};

// ── Delete Popup ──────────────────────────────────────────────
export const deletePopup = async (id) => {
  // Get popup data to delete associated image
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (snap.exists()) {
    const data = snap.data();
    if (data.imageUrl && data.imageUrl.includes('firebase')) {
      try {
        const imgRef = ref(storage, data.imageUrl);
        await deleteObject(imgRef).catch(() => {});
      } catch { /* ignore */ }
    }
  }
  await deleteDoc(doc(db, COLLECTION, id));
};
