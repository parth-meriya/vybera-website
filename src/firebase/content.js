import { db, storage } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Get the current banner configuration.
 */
export const getBannerConfig = async () => {
  try {
    // Try cache first for instant UI
    const cached = localStorage.getItem('vy_banner_config');
    if (cached) {
      // Return cache immediately, but we can't easily update the caller's state from here.
      // So we just fetch fresh data and update cache.
    }

    const snap = await getDoc(doc(db, 'settings', 'banner'));
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem('vy_banner_config', JSON.stringify(data));
      return data;
    }
    return null;
  } catch (err) {
    const cached = localStorage.getItem('vy_banner_config');
    return cached ? JSON.parse(cached) : null;
  }
};

/**
 * Get customization settings (prices, sizes).
 */
export const getCustomizeSettings = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'customize'));
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem('vy_customize_settings', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    const cached = localStorage.getItem('vy_customize_settings');
    if (cached) return JSON.parse(cached);
  }

  return {
    prices: { Front: 700, Back: 700, Both: 900 },
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  };
};

/**
 * Update customization settings.
 */
export const updateCustomizeSettings = async (settings) => {
  return setDoc(doc(db, 'settings', 'customize'), {
    ...settings,
    updatedAt: serverTimestamp(),
  });
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

