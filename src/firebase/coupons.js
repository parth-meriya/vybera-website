import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export const validateCoupon = async (code, orderTotal) => {
  const q = query(
    collection(db, 'coupons'),
    where('code', '==', code.toUpperCase()),
    where('active', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return { valid: false, message: 'Invalid coupon code.' };

  const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() };

  // Check expiry
  if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
    return { valid: false, message: 'This coupon has expired.' };
  }

  // Check minimum order
  if (coupon.minOrder && orderTotal < coupon.minOrder) {
    return {
      valid: false,
      message: `Minimum order of ₹${coupon.minOrder} required for this coupon.`,
    };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (orderTotal * coupon.value) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.type === 'flat') {
    discount = coupon.value;
  }

  return {
    valid: true,
    coupon,
    discount: Math.round(discount),
    message: `Coupon applied! You save ₹${Math.round(discount)}.`,
  };
};

export const getAllCoupons = async () => {
  const snap = await getDocs(collection(db, 'coupons'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addCoupon = async (couponData) => {
  await addDoc(collection(db, 'coupons'), {
    ...couponData,
    code: couponData.code.toUpperCase(),
    createdAt: serverTimestamp(),
  });
};

export const updateCoupon = async (id, couponData) => {
  await updateDoc(doc(db, 'coupons', id), {
    ...couponData,
    code: couponData.code.toUpperCase(),
  });
};

export const deleteCoupon = async (id) => {
  await deleteDoc(doc(db, 'coupons', id));
};

export const toggleCoupon = async (id, active) => {
  await updateDoc(doc(db, 'coupons', id), { active });
};
