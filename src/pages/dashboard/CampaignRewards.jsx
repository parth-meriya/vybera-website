/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Gift,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Filter,
  ShoppingCart,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { validateCoupon } from '../../firebase/coupons';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ─── helpers ───────────────────────────────────────────────────────
const fmt = (raw) => {
  if (!raw) return '—';
  const d = raw?.toDate ? raw.toDate() : new Date(raw);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getCouponStatus = (coupon) => {
  if (coupon.used) return 'used';
  if (coupon.expiry && new Date(coupon.expiry) < new Date()) return 'expired';
  return 'active';
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'used', label: 'Used' },
  { key: 'expired', label: 'Expired' },
];

// ─── animation variants ────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ─── component ─────────────────────────────────────────────────────
const CampaignRewards = () => {
  const { user } = useAuth();
  const { applyCoupon, subtotal } = useCart();
  const navigate = useNavigate();

  const [now] = useState(() => Date.now());
  const [rewards, setRewards] = useState([]);
  const [freeTees, setFreeTees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  // ── fetch data ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRewards = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Coupons won via campaigns
        const couponsQuery = query(
          collection(db, 'coupons'),
          where('uid', '==', user.uid)
        );
        const couponsSnap = await getDocs(couponsQuery);
        let couponsData = couponsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        couponsData = couponsData.filter((c) => c.campaignId != null);
        couponsData.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() ?? 0) -
            (a.createdAt?.toMillis?.() ?? 0)
        );
        setRewards(couponsData);

        // Free Tee transactions
        const teesQuery = query(
          collection(db, 'rewardTransactions'),
          where('userId', '==', user.uid),
          where('type', '==', 'FREE_TEE')
        );
        const teesSnap = await getDocs(teesQuery);
        const teesData = teesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        teesData.sort(
          (a, b) =>
            (b.timestamp?.toMillis?.() ?? 0) -
            (a.timestamp?.toMillis?.() ?? 0)
        );
        setFreeTees(teesData);
      } catch (err) {
        console.error('Error fetching campaign rewards:', err);
        toast.error('Failed to load rewards', { className: 'toast-vybera' });
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [user]);

  // ── derived data ──────────────────────────────────────────────────
  const enrichedRewards = useMemo(
    () => rewards.map((r) => ({ ...r, status: getCouponStatus(r) })),
    [rewards]
  );

  const filtered = useMemo(
    () =>
      activeTab === 'all'
        ? enrichedRewards
        : enrichedRewards.filter((r) => r.status === activeTab),
    [enrichedRewards, activeTab]
  );

  const expiringSoon = useMemo(
    () =>
      enrichedRewards.filter((r) => {
        if (r.status !== 'active' || !r.expiry) return false;
        const diff = new Date(r.expiry).getTime() - now;
        return diff > 0 && diff <= TWENTY_FOUR_HOURS;
      }),
    [enrichedRewards, now]
  );
  
  // ── check and write expiry notifications ─────────────────────────
  useEffect(() => {
    const checkExpiryNotifications = async () => {
      if (!user || expiringSoon.length === 0) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        
        const userData = userSnap.data();
        const currentNotifications = userData.notifications || [];
        
        // Find which expiring coupons don't have an expiry notification yet
        for (const coupon of expiringSoon) {
          const hasNotif = currentNotifications.some(
            n => n.id === `notif_expiry_${coupon.code}`
          );
          
          if (!hasNotif) {
            // Add notification
            await updateDoc(userRef, {
              notifications: arrayUnion({
                id: `notif_expiry_${coupon.code}`,
                type: 'promo',
                title: 'Coupon Expiring Soon!',
                message: `Your campaign coupon "${coupon.code}" (${coupon.type === 'percentage' ? coupon.value + '% OFF' : '₹' + coupon.value + ' OFF'}) is expiring within 24 hours. Use it now!`,
                createdAt: new Date().toISOString(),
                read: false
              })
            });
          }
        }
      } catch (err) {
        console.error('Failed to create expiry notification:', err);
      }
    };
    
    checkExpiryNotifications();
  }, [user, expiringSoon]);

  const tabCounts = useMemo(() => {
    const counts = { all: enrichedRewards.length, active: 0, used: 0, expired: 0 };
    enrichedRewards.forEach((r) => counts[r.status]++);
    return counts;
  }, [enrichedRewards]);

  // ── handlers ──────────────────────────────────────────────────────
  const handleCopy = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success('Coupon code copied!', { className: 'toast-vybera' });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy', { className: 'toast-vybera' });
    }
  };

  const handleApply = async (reward) => {
    try {
      setApplyingId(reward.id);
      const result = await validateCoupon(reward.code, subtotal, user.uid);
      if (result.valid) {
        applyCoupon(result.coupon);
        toast.success(result.message, { className: 'toast-vybera' });
        navigate('/cart');
      } else {
        toast.error(result.message, { className: 'toast-vybera' });
      }
    } catch {
      toast.error('Something went wrong', { className: 'toast-vybera' });
    } finally {
      setApplyingId(null);
    }
  };

  // ── loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="text-vy-gold animate-spin" size={24} />
      </div>
    );
  }

  // ── empty state ───────────────────────────────────────────────────
  if (rewards.length === 0 && freeTees.length === 0) {
    return (
      <div>
        <h2 className="text-[#30231F] font-display font-bold text-2xl tracking-widest uppercase mb-8">
          My Coupons
        </h2>
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-12 text-center rounded-2xl shadow-sm">
          <Ticket size={48} className="text-[#D4BEA5] mx-auto mb-4" />
          <p className="text-[#30231F] font-bold tracking-wider text-lg">
            No rewards yet
          </p>
          <p className="text-[#75665C] text-sm mt-2 max-w-sm mx-auto font-medium">
            Find our secret QR codes in the real world to spin the wheel and win
            exclusive discounts.
          </p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-[#30231F] font-display font-bold text-2xl tracking-widest uppercase mb-8">
        My Coupons
      </h2>

      {/* ── Expiry warning banner ──────────────────────────────────── */}
      <AnimatePresence>
        {expiringSoon.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-3 flex items-start gap-3 shadow-sm">
              <AlertTriangle
                size={18}
                className="text-amber-700 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-amber-900 text-sm font-bold tracking-wider uppercase">
                  Coupon expiring soon!
                </p>
                <p className="text-amber-800 text-xs mt-1 font-medium">
                  {expiringSoon.length === 1
                    ? `Code "${expiringSoon[0].code}" expires within 24 hours. Use it before it's gone!`
                    : `${expiringSoon.length} coupons expire within 24 hours. Use them before they're gone!`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-10">
        {/* ── FREE TEES Section ──────────────────────────────────── */}
        {freeTees.length > 0 && (
          <div>
            <h3 className="text-[#590907] text-xs font-bold tracking-widest uppercase mb-4 border-b border-[#D4BEA5] pb-2 flex items-center gap-2">
              <Gift size={14} />
              Physical Rewards (Free Tees)
            </h3>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {freeTees.map((tee) => (
                <motion.div
                  variants={card}
                  key={tee.id}
                  className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 rounded-xl flex items-start gap-4 shadow-sm"
                >
                  <div className="bg-[#590907]/10 p-3 rounded-full text-[#590907] shrink-0">
                    <Gift size={24} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[#30231F] font-bold text-sm tracking-wider uppercase">
                      Free Exclusive Tee
                    </h4>
                    <p className="text-[#75665C] text-xs mt-1 font-medium">
                      Campaign: {tee.campaignId}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded border ${
                          tee.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : tee.status === 'approved'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : tee.status === 'shipped'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        Status: {tee.status}
                      </span>
                    </div>

                    {tee.status === 'pending' && (
                      <p className="text-[#75665C] text-[10px] mt-3 tracking-wide font-medium">
                        Our team will contact you soon on your registered mobile
                        number.
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* ── COUPONS Section ────────────────────────────────────── */}
        {rewards.length > 0 && (
          <div>
            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-6 border-b border-[#D4BEA5] overflow-x-auto scrollbar-none">
              <Filter size={14} className="text-[#75665C] mr-2 shrink-0" />
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2.5 text-[11px] font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'text-[#590907]'
                      : 'text-[#75665C] hover:text-[#30231F]'
                  }`}
                >
                  {tab.label}
                  {tabCounts[tab.key] > 0 && (
                    <span className="ml-1.5 text-[9px] opacity-75 font-semibold">
                      ({tabCounts[tab.key]})
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="couponTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#590907]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Coupon grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={container}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filtered.length === 0 ? (
                  <div className="col-span-full bg-[#FAF5ED] border border-[#D4BEA5] p-10 text-center rounded-xl shadow-sm">
                    <Ticket
                      size={32}
                      className="text-[#D4BEA5] mx-auto mb-3"
                    />
                    <p className="text-[#75665C] text-sm tracking-wider font-medium">
                      No {activeTab} coupons
                    </p>
                  </div>
                ) : (
                  filtered.map((reward) => {
                    const isActive = reward.status === 'active';
                    const isUsed = reward.status === 'used';
                    const isExpiringSoon =
                      isActive &&
                      reward.expiry &&
                      new Date(reward.expiry).getTime() - now <=
                        TWENTY_FOUR_HOURS;

                    return (
                      <motion.div
                        variants={card}
                        key={reward.id}
                        className={`bg-[#FAF5ED] border rounded-xl relative overflow-hidden shadow-sm ${
                          isActive
                            ? 'border-[#D4BEA5] hover:border-[#590907]'
                            : 'border-[#D4BEA5]/60 opacity-60'
                        } transition-colors`}
                      >
                        {/* Expiring-soon ribbon */}
                        {isExpiringSoon && (
                          <div className="bg-amber-100 px-4 py-1.5 flex items-center gap-1.5 border-b border-amber-300">
                            <Clock size={10} className="text-amber-800" />
                            <span className="text-amber-900 text-[9px] font-bold tracking-widest uppercase">
                              Expires soon
                            </span>
                          </div>
                        )}

                        <div className="p-5">
                          {/* Code + copy */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-[#F3E7D8] border border-[#D4BEA5] px-3 py-1.5 text-[#590907] text-xs font-mono font-bold tracking-widest uppercase rounded-lg inline-flex items-center gap-1.5 min-w-0">
                              <Ticket
                                size={12}
                                className="text-[#590907] shrink-0"
                              />
                              <span className="truncate">{reward.code}</span>
                            </div>
                            <button
                              onClick={() =>
                                handleCopy(reward.code, reward.id)
                              }
                              className="ml-2 p-1.5 rounded-lg border border-[#D4BEA5] bg-white hover:bg-[#F3E7D8]/40 text-[#75665C] hover:text-[#590907] transition-colors shrink-0 shadow-sm"
                              title="Copy code"
                            >
                              {copiedId === reward.id ? (
                                <Check size={14} className="text-emerald-700" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>

                          {/* Discount value */}
                          <p
                            className={`font-display font-black text-xl tracking-wider ${
                              isUsed
                                ? 'text-[#75665C] line-through'
                                : 'text-[#590907]'
                            }`}
                          >
                            {reward.type === 'percentage'
                              ? `${reward.value}% OFF`
                              : `₹${reward.value} OFF`}
                          </p>

                          {/* Campaign name */}
                          <p className="text-[#75665C] text-[10px] uppercase tracking-widest mt-1 font-semibold">
                            {reward.campaignId}
                          </p>

                          {/* Dates */}
                          <div className="mt-4 space-y-1">
                            <p className="text-[#75665C] text-[11px] tracking-wide font-medium">
                              Won:{' '}
                              <span className="text-[#30231F] font-bold">
                                {fmt(reward.createdAt)}
                              </span>
                            </p>
                            <p className="text-[#75665C] text-[11px] tracking-wide font-medium">
                              Expires:{' '}
                              <span
                                className={
                                  isExpiringSoon
                                    ? 'text-amber-800 font-bold'
                                    : 'text-[#30231F] font-bold'
                                }
                              >
                                {fmt(reward.expiry)}
                              </span>
                            </p>
                          </div>

                          {/* Footer: Status + action */}
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#D4BEA5]">
                            {/* Status badge */}
                            <span
                              className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : isUsed
                                  ? 'bg-slate-100 text-slate-600 border-slate-300 line-through'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isActive
                                ? 'Active'
                                : isUsed
                                ? 'Used'
                                : 'Expired'}
                            </span>

                            {/* Apply to cart */}
                            {isActive && (
                              <button
                                onClick={() => handleApply(reward)}
                                disabled={applyingId === reward.id}
                                className="flex items-center gap-1.5 btn-primary text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {applyingId === reward.id ? (
                                  <RefreshCw
                                    size={11}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <ShoppingCart size={11} />
                                )}
                                Apply to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignRewards;
