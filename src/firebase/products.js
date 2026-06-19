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
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

export const uploadProductImage = (file) => {
  return new Promise((resolve, reject) => {
    // ALTERNATIVE: Convert compressed image directly to Base64 String 
    // This perfectly bypasses all Firebase Storage network bottlenecks!
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export const deleteProductImage = async (url) => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (e) {
    console.warn('Image delete failed:', e.message);
  }
};

export const getProducts = async () => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getFeaturedProducts = async () => {
  const q = query(
    collection(db, 'products'),
    where('featured', '==', true)
  );
  const snap = await getDocs(q);
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return products.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
};

export const getDropProducts = async () => {
  const q = query(
    collection(db, 'products'),
    where('isDrop', '==', true)
  );
  const snap = await getDocs(q);
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return products.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
};

export const getProductsByCategory = async (category) => {
  const q = query(
    collection(db, 'products'),
    where('category', '==', category)
  );
  const snap = await getDocs(q);
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return products.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
};

export const getProductById = async (id) => {
  const snap = await getDoc(doc(db, 'products', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const addProduct = async (productData, imageFiles = []) => {
  console.log("[Firebase] addProduct triggered. Files:", imageFiles.length);
  let images = productData.images || [];

  if (productData.image && !images.includes(productData.image)) {
    images.push(productData.image);
  }

  if (imageFiles && imageFiles.length > 0) {
    console.log("[Firebase] Uploading images...");
    const uploadPromises = imageFiles.map(file => uploadProductImage(file));
    const newImageUrls = await Promise.all(uploadPromises);
    console.log("[Firebase] Image upload complete", newImageUrls);
    images = [...images, ...newImageUrls];
  }

  console.log("[Firebase] Adding doc to Firestore...");
  const docRef = await addDoc(collection(db, 'products'), {
    ...productData,
    image: images[0] || '',
    images,
    createdAt: serverTimestamp(),
  });
  console.log("[Firebase] Firestore Write successful. ID:", docRef.id);
  return docRef.id;
};

export const updateProduct = async (id, productData, imageFiles = []) => {
  let images = productData.images || [];

  if (productData.image && !images.includes(productData.image)) {
    images.push(productData.image);
  }

  if (imageFiles && imageFiles.length > 0) {
    const uploadPromises = imageFiles.map(file => uploadProductImage(file));
    const newImageUrls = await Promise.all(uploadPromises);
    images = [...images, ...newImageUrls];
  }

  await updateDoc(doc(db, 'products', id), {
    ...productData,
    image: images[0] || '',
    images,
  });
};

export const deleteProduct = async (id) => {
  const product = await getProductById(id);
  
  if (product?.images?.length > 0) {
    await Promise.all(product.images.map(url => deleteProductImage(url)));
  } else if (product?.image) {
    await deleteProductImage(product.image);
  }
  
  await deleteDoc(doc(db, 'products', id));
};

export const bulkUpdateProducts = async (ids, updateData) => {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 500) {
    chunks.push(ids.slice(i, i + 500));
  }
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(id => {
      const productRef = doc(db, 'products', id);
      batch.update(productRef, updateData);
    });
    await batch.commit();
  }
};
