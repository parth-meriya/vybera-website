import { db, storage } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Get the current banner configuration.
 */
export const getBannerConfig = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'banner'));
    if (snap.exists()) return snap.data();
    return null;
  } catch (err) {
    console.error('Error fetching banner config:', err);
    return null;
  }
};

/**
 * Update the banner configuration.
 * @param {Object} config - { imageUrl, headline, subtitle, expiryDate, isActive }
 */
/**
 * Upload banner image to Storage.
 */
export const uploadBanner = async (file) => {
  const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
};

