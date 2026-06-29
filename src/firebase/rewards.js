import { collection, doc, getDoc, getDocs, query, setDoc, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';

/**
 * Fetch global rewards settings
 */
export const getRewardSettings = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'rewards'));
    if (snap.exists()) return snap.data();
    
    // Default fallback
    return {
      enabled: true,
      earningRate: 100, // 100 points per product
      redemptionRate: 1, // 1 point = 1 INR
      minPayable: 99,
    };
  } catch (error) {
    console.error('Error fetching reward settings:', error);
    return null;
  }
};

/**
 * Update global rewards settings (Admin only)
 */
export const updateRewardSettings = async (settingsData) => {
  return setDoc(doc(db, 'settings', 'rewards'), settingsData, { merge: true });
};

/**
 * Fetch reward transactions for a user
 */
export const getUserRewardTransactions = async (userId) => {
  try {
    const q = query(
      collection(db, 'rewardTransactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user reward transactions:', error);
    return [];
  }
};

/**
 * Manually add or deduct points (Admin only)
 * Type: MANUAL_ADD or MANUAL_DEDUCT
 */
export const manualPointAdjustment = async (userId, points, type, description) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to perform this action.');

  const token = await currentUser.getIdToken();
  const res = await fetch('/api/admin/adjust-points', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      targetUid: userId,
      points,
      type,
      description
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to adjust points via secure API');
  }

  return true;
};
