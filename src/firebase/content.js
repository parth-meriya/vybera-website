import { db } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
export const updateBannerConfig = async (config) => {
  return setDoc(doc(db, 'settings', 'banner'), {
    ...config,
    updatedAt: serverTimestamp(),
  });
};
