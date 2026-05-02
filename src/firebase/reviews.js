import { db, storage } from './config';
import {
  collection, addDoc, getDocs, doc, deleteDoc,
  serverTimestamp, query, orderBy, where, updateDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload single review image to Firebase Storage.
 */
export const uploadReviewImage = (file, userId) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(
      storage,
      `reviews/${userId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      () => {}, // No precise progress tracking needed for short background tasks here
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

/**
 * Add a new review if one doesn't exist yet for this product & user.
 * @param {Object} data { productId, userId, userName, rating, reviewText }
 * @param {Array} imageFiles Array of raw File objects
 */
export const addReview = async (data, imageFiles = []) => {
  // Check if they already reviewed
  const q = query(
    collection(db, 'reviews'), 
    where('productId', '==', data.productId),
    where('userId', '==', data.userId)
  );
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    throw new Error('You have already submitted a review for this product.');
  }

  // Upload images
  const imageUrls = [];
  if (imageFiles && imageFiles.length > 0) {
    for (let file of imageFiles) {
      const url = await uploadReviewImage(file, data.userId);
      imageUrls.push(url);
    }
  }

  // Save document
  const docRef = await addDoc(collection(db, 'reviews'), {
    ...data,
    imageUrls,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
};

/**
 * Fetch reviews for a specific product.
 */
export const getReviewsByProduct = async (productId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
};

/**
 * Fetch all reviews (Admin only)
 */
export const getAllReviews = async () => {
  try {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return [];
  }
};

/**
 * Delete a review (Admin & Owner)
 */
export const deleteReview = async (reviewId) => {
  return deleteDoc(doc(db, 'reviews', reviewId));
};
