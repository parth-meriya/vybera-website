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
  onSnapshot,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { isProductSaleActive, isProductNewDropActive } from '../utils/pricing';
export { isProductSaleActive, isProductNewDropActive };

export const uploadProductImage = (file) => {
  return new Promise((resolve, reject) => {
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

/**
 * Real-time listener for all products across client storefront and admin.
 */
export const listenToProducts = (callback, onError) => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(prods);
    },
    (err) => {
      console.warn('Realtime listenToProducts snapshot error:', err);
      if (onError) onError(err);
    }
  );
};

export const getFeaturedProducts = async () => {
  const prods = await getProducts();
  return prods.filter(p => p.featured === true || p.isFeatured === true);
};

/**
 * 1. NEW DROPS:
 * Fetches products manually assigned to New Drops by the admin (showInNewDrops === true).
 * Ordered by newDropPriority desc, then createdAt desc.
 */
export const getNewDropProducts = async () => {
  const prods = await getProducts();
  const drops = prods.filter(p => isProductNewDropActive(p));
  return drops.sort((a, b) => {
    const prioDiff = (Number(b.newDropPriority) || 0) - (Number(a.newDropPriority) || 0);
    if (prioDiff !== 0) return prioDiff;
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  });
};

// Backward-compatible alias
export const getDropProducts = getNewDropProducts;

/**
 * 2. SALE:
 * Fetches products manually assigned to the Sale section by the admin (showInSale === true).
 * Ordered by salePriority desc, then createdAt desc.
 */
export const getSaleProducts = async () => {
  const prods = await getProducts();
  const saleList = prods.filter(p => isProductSaleActive(p));
  return saleList.sort((a, b) => {
    const prioDiff = (Number(b.salePriority) || 0) - (Number(a.salePriority) || 0);
    if (prioDiff !== 0) return prioDiff;
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  });
};

/**
 * 3. COLLECTIONS:
 * Fetches products assigned to Collections (showInCollections !== false).
 * All regular and older products remain accessible here.
 */
export const getCollectionProducts = async (category = null) => {
  const prods = await getProducts();
  let colls = prods.filter(p => p.showInCollections !== false);
  if (category && category !== 'all' && category !== 'shop') {
    const catLower = category.toLowerCase();
    colls = colls.filter(p => p.category?.toLowerCase() === catLower);
  }
  return colls;
};

export const getProductsByCategory = async (category) => {
  return getCollectionProducts(category);
};

export const getProductById = async (id) => {
  const snap = await getDoc(doc(db, 'products', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Product Analytics for Admin Dashboard
 */
export const getProductAnalytics = async () => {
  const prods = await getProducts();
  const now = Date.now();

  let newDropsCount = 0;
  let saleProductsCount = 0;
  let collectionProductsCount = 0;
  let activeSaleCount = 0;
  let scheduledSaleCount = 0;

  prods.forEach(p => {
    if (p.showInCollections !== false) collectionProductsCount++;
    if (isProductNewDropActive(p)) newDropsCount++;
    if (p.showInSale === true || (p.salePrice && Number(p.salePrice) > 0)) {
      saleProductsCount++;
      if (isProductSaleActive(p)) {
        activeSaleCount++;
      } else if (p.saleStartAt && new Date(p.saleStartAt).getTime() > now) {
        scheduledSaleCount++;
      }
    }
  });

  return {
    totalProducts: prods.length,
    newDropsCount,
    saleProductsCount,
    collectionProductsCount,
    activeSaleCount,
    scheduledSaleCount,
  };
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

  // Determine showOnHome value and keep legacy isFeatured / featured in sync
  const homeVal = productData.showOnHome !== undefined
    ? Boolean(productData.showOnHome)
    : Boolean(productData.isFeatured || productData.featured);

  // Sanitize numeric and boolean fields
  const sanitized = {
    ...productData,
    price: Math.max(0, Number(productData.price || 0)),
    originalPrice: productData.originalPrice ? Math.max(0, Number(productData.originalPrice)) : null,
    salePrice: productData.salePrice ? Math.max(0, Number(productData.salePrice)) : null,
    showInCollections: productData.showInCollections !== undefined ? Boolean(productData.showInCollections) : true,
    showInNewDrops: Boolean(productData.showInNewDrops),
    showInSale: Boolean(productData.showInSale),
    showOnHome: homeVal,
    newDropPriority: Number(productData.newDropPriority) || 0,
    salePriority: Number(productData.salePriority) || 0,
    isFeatured: homeVal,
    featured: homeVal,
    isDrop: Boolean(productData.showInNewDrops),
    image: images[0] || '',
    images,
    createdAt: serverTimestamp(),
  };

  console.log("[Firebase] Adding doc to Firestore...");
  const docRef = await addDoc(collection(db, 'products'), sanitized);
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

  // Determine showOnHome value and keep legacy isFeatured / featured in sync
  const homeVal = productData.showOnHome !== undefined
    ? Boolean(productData.showOnHome)
    : (productData.isFeatured !== undefined || productData.featured !== undefined)
      ? Boolean(productData.isFeatured || productData.featured)
      : undefined;

  const sanitized = {
    ...productData,
    price: Math.max(0, Number(productData.price || 0)),
    originalPrice: productData.originalPrice ? Math.max(0, Number(productData.originalPrice)) : null,
    salePrice: productData.salePrice ? Math.max(0, Number(productData.salePrice)) : null,
    showInCollections: productData.showInCollections !== undefined ? Boolean(productData.showInCollections) : true,
    showInNewDrops: Boolean(productData.showInNewDrops),
    showInSale: Boolean(productData.showInSale),
    ...(homeVal !== undefined ? { showOnHome: homeVal, isFeatured: homeVal, featured: homeVal } : {}),
    newDropPriority: Number(productData.newDropPriority) || 0,
    salePriority: Number(productData.salePriority) || 0,
    isDrop: Boolean(productData.showInNewDrops),
    image: images[0] || '',
    images,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'products', id), sanitized);
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
