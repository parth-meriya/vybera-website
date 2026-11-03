/**
 * VYBERA — Diwali Spin & Win Campaign Schedule Helper
 *
 * Campaign: VYBERA DIWALI DHAMAKA — SPIN & WIN
 * Start: 7 November 2026, 00:00:00 IST
 * End: 20 November 2026, 23:59:59 IST
 * Timezone: Asia/Kolkata (+05:30)
 */

export const DIWALI_CAMPAIGN_ID = 'diwali-dhamaka';

export const DIWALI_CAMPAIGN_DEFAULTS = {
  id: DIWALI_CAMPAIGN_ID,
  name: 'VYBERA DIWALI DHAMAKA — SPIN & WIN',
  headline: 'VYBERA DIWALI DHAMAKA',
  mainText: 'SPIN. WIN. SLAY.',
  subtitle: 'Your Diwali surprise is waiting!',
  discountDisplay: '20% | 30% | 50% | 70% OFF',
  startDate: '2026-11-01T00:00:00+05:30',
  endDate: '2026-11-20T23:59:59+05:30',
  active: true,
  expiryDays: 14,
  usageLimit: 0, // 0 = unlimited total spins (1 per customer)
  rewards: [
    { type: 'percentage', value: 20, name: '20% OFF', probability: 40, index: 0, color: '#590907' },
    { type: 'percentage', value: 30, name: '30% OFF', probability: 30, index: 1, color: '#D4AF37' },
    { type: 'percentage', value: 50, name: '50% OFF', probability: 18, index: 2, color: '#3B0403' },
    { type: 'percentage', value: 70, name: '70% OFF', probability: 10, index: 3, color: '#E8D2B5' },
    { type: 'free_tee', value: null, name: 'FREE TEE', probability: 2, index: 4, color: '#FAF5ED' },
  ],
};

/**
 * Returns current timestamp in ms.
 * Supports date simulation for testing.
 */
export const getNowTimestamp = (overrideDate = null) => {
  if (overrideDate) {
    const d = new Date(overrideDate);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return Date.now();
};

/**
 * Evaluate the schedule of the Diwali Campaign in Asia/Kolkata timezone.
 *
 * @param {Object} campaign - Campaign data from Firestore or default
 * @param {Object} options - { nowOverride: Date/String, isPreview: boolean }
 * @returns {Object} status info
 */
export const getDiwaliCampaignStatus = (campaign = {}, options = {}) => {
  const merged = { ...DIWALI_CAMPAIGN_DEFAULTS, ...campaign };
  const { nowOverride = null, isPreview = false } = options;

  if (isPreview) {
    return {
      status: 'active',
      isLive: true,
      message: 'Admin Preview Mode (Bypassing Schedule)',
      campaign: merged,
    };
  }

  if (merged.active === false) {
    return {
      status: 'inactive',
      isLive: false,
      message: 'Campaign is currently deactivated by Admin',
      campaign: merged,
    };
  }

  const now = getNowTimestamp(nowOverride);
  const start = new Date(merged.startDate || DIWALI_CAMPAIGN_DEFAULTS.startDate).getTime();
  const end = new Date(merged.endDate || DIWALI_CAMPAIGN_DEFAULTS.endDate).getTime();

  // Before 7 Nov 2026 IST
  if (!isNaN(start) && now < start) {
    const diffMs = start - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: 'upcoming',
      isLive: false,
      message: `Launches on 7 November 2026 IST (${diffDays} day${diffDays === 1 ? '' : 's'} to go)`,
      diffMs,
      campaign: merged,
    };
  }

  // After 20 Nov 2026 IST
  if (!isNaN(end) && now > end) {
    return {
      status: 'ended',
      isLive: false,
      message: 'Campaign concluded on 20 November 2026 IST',
      campaign: merged,
    };
  }

  // Between 7 Nov and 20 Nov 2026 IST
  const remainingMs = end - now;
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  return {
    status: 'active',
    isLive: true,
    message: `Active until 20 November 2026 IST (${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining)`,
    remainingMs,
    campaign: merged,
  };
};

/**
 * Format date in Asia/Kolkata timezone
 */
export const formatISTDate = (isoOrDate) => {
  if (!isoOrDate) return '—';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
};
