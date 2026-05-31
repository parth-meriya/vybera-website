import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from './config';

// Fetch all sections, ordered by their 'order' field
export const getSections = async () => {
  const q = query(collection(db, 'sections'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Add a new custom section
export const addSection = async (sectionData) => {
  const newRef = doc(collection(db, 'sections'), sectionData.slug);
  await setDoc(newRef, {
    label: sectionData.label,
    slug: sectionData.slug,
    visible: sectionData.visible !== false, // default true
    isSystem: false,
    path: `/collections/${sectionData.slug}`,
    order: sectionData.order || 99,
  });
};

// Update an existing section (e.g. toggle visibility)
export const updateSection = async (slug, data) => {
  await updateDoc(doc(db, 'sections', slug), data);
};

// Delete a custom section (prevents deleting system sections)
export const deleteSection = async (slug) => {
  await deleteDoc(doc(db, 'sections', slug));
};
