import { db, storage } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const DEFAULT_DIWALI_CAMPAIGN = {
  enabled: true,
  headline: 'DIWALI VIBES. BIGGER DROPS. BETTER DEALS.',
  subtitle: 'Celebrate the festival of lights with your favourite VYBERA fits.',
  ctaText: 'SHOP DIWALI SALE',
  ctaLink: '/shop',
  desktopBannerUrl: '/hero_banner.png',
  mobileBannerUrl: '/hero_banner.png',
  badgeText: 'DIWALI FESTIVE EDITION',
  discountPercent: 0,
  discountCode: 'DIWALI',
  startDate: '',
  endDate: '',
  showCountdown: true,
  featuredProductIds: [],
};

const CACHE_KEY = 'vy_diwali_campaign';

/**
 * Checks if a campaign is currently active based on enabled flag and start/end dates.
 */
export const isCampaignActive = (campaign) => {
  if (!campaign || campaign.enabled === false) return false;
  const now = new Date().getTime();

  if (campaign.startDate) {
    const start = new Date(campaign.startDate).getTime();
    if (!isNaN(start) && now < start) return false;
  }

  if (campaign.endDate) {
    const end = new Date(campaign.endDate).getTime();
    if (!isNaN(end) && now > end) return false;
  }

  return true;
};

/**
 * Fetch the Diwali campaign configuration from Firestore (with localStorage fallback).
 */
export const getDiwaliCampaign = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'diwaliCampaign'));
    if (snap.exists()) {
      const data = { ...DEFAULT_DIWALI_CAMPAIGN, ...snap.data() };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        // Ignore quota
      }
      return data;
    }
    return DEFAULT_DIWALI_CAMPAIGN;
  } catch (err) {
    console.warn('Failed to fetch diwali campaign from Firestore, trying cache:', err);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore
    }
    return DEFAULT_DIWALI_CAMPAIGN;
  }
};

/**
 * Update the Diwali campaign configuration in Firestore and sync global campaign discount.
 */
export const updateDiwaliCampaign = async (campaignData) => {
  const payload = {
    ...campaignData,
    discountPercent: Number(campaignData.discountPercent) || 0,
    updatedAt: serverTimestamp(),
  };

  // 1. Save to dedicated diwaliCampaign settings
  await setDoc(doc(db, 'settings', 'diwaliCampaign'), payload);

  // 2. Keep settings/campaign in sync for checkout & cart pricing compatibility
  try {
    await setDoc(doc(db, 'settings', 'campaign'), {
      active: isCampaignActive(campaignData),
      name: campaignData.headline || 'Diwali Sale',
      discountPercent: Number(campaignData.discountPercent) || 0,
      endDate: campaignData.endDate || '',
      updatedAt: serverTimestamp(),
    });
  } catch (syncErr) {
    console.warn('Sync to settings/campaign warning:', syncErr);
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore
  }

  return payload;
};

/**
 * Upload banner image to Firebase Storage for Diwali Campaign
 */
export const uploadDiwaliBanner = async (file, type = 'desktop') => {
  const storageRef = ref(storage, `banners/diwali_${type}_${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
};
