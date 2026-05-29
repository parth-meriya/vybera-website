import { collection, doc, getDoc, getDocs, query, setDoc, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

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
  // Since this updates the user document as well, it's safer to do via a Firebase Function or API,
  // but if done from the frontend admin panel, we update both documents manually.
  // Note: For absolute security against race conditions, this should ideally be moved to an API endpoint.
  // We'll leave it here for basic admin panel usage.
  
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');
  
  const userData = userSnap.data();
  const currentPoints = userData.rewardPoints || 0;
  
  let newPoints = currentPoints;
  if (type === 'MANUAL_ADD') {
    newPoints += points;
  } else if (type === 'MANUAL_DEDUCT') {
    newPoints -= points;
    if (newPoints < 0) newPoints = 0;
  }
  
  await setDoc(userRef, {
    rewardPoints: newPoints,
    ...(type === 'MANUAL_ADD' ? { totalEarnedPoints: (userData.totalEarnedPoints || 0) + points } : {})
  }, { merge: true });
  
  await addDoc(collection(db, 'rewardTransactions'), {
    userId,
    points,
    type,
    description,
    timestamp: serverTimestamp()
  });
};
