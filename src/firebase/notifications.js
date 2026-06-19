import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './config';

/**
 * Add a notification to a user's profile
 * @param {string} uid - User ID
 * @param {object} notification - { type: 'coupon'|'order'|'promo'|'info', title: string, message: string }
 */
export const addNotification = async (uid, { type, title, message }) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    notifications: arrayUnion({
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false
    })
  });
};
