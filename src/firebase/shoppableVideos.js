import { db } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const DEFAULT_SHOPPABLE_VIDEOS = [
  {
    id: 'v1',
    productName: 'Raw Obsidian Oversized Tee',
    price: 999,
    compareAtPrice: 1499,
    thumbnailUrl: '/Design/7th%20boy/thumb_v1.webp',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-sitting-on-a-bench-fashion-portrait-42730-large.mp4',
    shopUrl: '/shop',
    customizeUrl: '/customize?fit=Oversize',
  },
  {
    id: 'v2',
    productName: 'Burgundy Shadow Heavyweight Tee',
    price: 1099,
    compareAtPrice: 1699,
    thumbnailUrl: '/Design/6th%20girl/thumb_v2.webp',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-a-white-t-shirt-posing-for-the-camera-42728-large.mp4',
    shopUrl: '/shop',
    customizeUrl: '/customize?fit=Oversize',
  },
  {
    id: 'v3',
    productName: 'Vintage Sage Boxy Fit Tee',
    price: 899,
    compareAtPrice: 1299,
    thumbnailUrl: '/Design/8th%20boy/thumb_v3.webp',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-model-posing-in-a-gray-t-shirt-42729-large.mp4',
    shopUrl: '/shop',
    customizeUrl: '/customize?fit=Oversize',
  },
  {
    id: 'v4',
    productName: 'Duality Couple Streetwear Drop',
    price: 1899,
    compareAtPrice: 2499,
    thumbnailUrl: '/Design/couple/thumb_v4.webp',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-couple-walking-in-the-street-42731-large.mp4',
    shopUrl: '/shop',
    customizeUrl: '/customize',
  },
];

const CACHE_KEY = 'vy_shoppable_videos';

export const getShoppableVideos = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'shoppableVideos'));
    if (snap.exists() && snap.data().videos && snap.data().videos.length > 0) {
      const list = snap.data().videos;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch {
        // Ignore quota
      }
      return list;
    }
    return DEFAULT_SHOPPABLE_VIDEOS;
  } catch (err) {
    console.warn('Failed to load shoppable videos from Firestore, falling back to cache:', err);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore
    }
    return DEFAULT_SHOPPABLE_VIDEOS;
  }
};

export const updateShoppableVideos = async (videos) => {
  await setDoc(doc(db, 'settings', 'shoppableVideos'), {
    videos,
    updatedAt: serverTimestamp(),
  });
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(videos));
  } catch {
    // Ignore
  }
  return videos;
};
