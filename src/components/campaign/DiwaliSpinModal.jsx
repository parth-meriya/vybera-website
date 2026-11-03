/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Ticket,
  Copy,
  Check,
  ShoppingCart,
  ArrowRight,
  Flame,
  Award,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import DiwaliSpinWheel, { DIWALI_SEGMENTS } from './DiwaliSpinWheel';
import DiwaliDiyaIcon from './DiwaliDiyaIcon';
import { DIWALI_CAMPAIGN_ID, getDiwaliCampaignStatus } from '../../utils/diwaliCampaignSchedule';

export const DiwaliSpinModal = ({
  isOpen = false,
  onClose,
  campaignData = null,
  isPreview = false,
}) => {
  const { user } = useAuth();
  const { applyCoupon } = useCart();
  const navigate = useNavigate();

  const [loadingCheck, setLoadingCheck] = useState(true);
  const [hasSpun, setHasSpun] = useState(false);
  const [previousReward, setPreviousReward] = useState(null);
  const [previousCoupon, setPreviousCoupon] = useState(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState(null);
  const [wonReward, setWonReward] = useState(null);
  const [couponCode, setCouponCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  const campaignId = campaignData?.id || DIWALI_CAMPAIGN_ID;

  // ─── Check eligibility & previous spin on mount / user change ───────
  useEffect(() => {
    let isMounted = true;

    const checkUserEligibility = async () => {
      if (!user) {
        if (isMounted) setLoadingCheck(false);
        return;
      }

      try {
        setLoadingCheck(true);

        // In preview mode without real user, skip
        if (isPreview && user.email === 'preview@admin.local') {
          if (isMounted) setLoadingCheck(false);
          return;
        }

        // Query spinResults for this campaign
        const spinsQ = query(
          collection(db, 'spinResults'),
          where('uid', '==', user.uid),
          where('campaignId', '==', campaignId)
        );
        const spinSnap = await getDocs(spinsQ);

        if (!spinSnap.empty && isMounted) {
          const spinData = spinSnap.docs[0].data();
          setHasSpun(true);
          setPreviousReward(spinData.rewardWon);

          // Find associated coupon if any
          const couponQ = query(
            collection(db, 'coupons'),
            where('uid', '==', user.uid),
            where('campaignId', '==', campaignId)
          );
          const couponSnap = await getDocs(couponQ);
          if (!couponSnap.empty) {
            setPreviousCoupon(couponSnap.docs[0].data());
          }
        } else if (isMounted) {
          setHasSpun(false);
          setPreviousReward(null);
          setPreviousCoupon(null);
        }
      } catch (err) {
        console.error('Error checking spin status:', err);
      } finally {
        if (isMounted) setLoadingCheck(false);
      }
    };

    if (isOpen) {
      checkUserEligibility();
    }

    return () => {
      isMounted = false;
    };
  }, [user, isOpen, campaignId, isPreview]);

  // ─── Handle Spin Execution ──────────────────────────────────────────
  const handleSpinNow = async () => {
    if (isSpinning) return;

    if (!user) {
      toast('Please sign in to spin and win your Diwali gift!', {
        icon: '✨',
        className: 'toast-vybera',
      });
      onClose();
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (hasSpun && !isPreview) {
      toast.error('You have already claimed your Diwali gift for this year!', {
        className: 'toast-vybera',
      });
      return;
    }

    try {
      setIsSpinning(true);
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch('/api/campaign/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignId,
          preview: isPreview,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadySpun) {
          setHasSpun(true);
          setPreviousReward(data.previousReward);
          toast.error(data.error || 'Already spun!', { className: 'toast-vybera' });
        } else {
          toast.error(data.error || 'Failed to complete spin. Please try again.', {
            className: 'toast-vybera',
          });
        }
        setIsSpinning(false);
        return;
      }

      // Successful server response
      const serverReward = data.reward;
      const serverCoupon = data.couponCode;

      // Find segment index
      let targetIdx = DIWALI_SEGMENTS.findIndex((s) => s.label === serverReward.name);
      if (targetIdx === -1) targetIdx = serverReward.index ?? 0;

      // Store in state and let wheel animate
      setWinningIndex(targetIdx);
      setWonReward(serverReward);
      setCouponCode(serverCoupon);
    } catch (err) {
      console.error('Spin error:', err);
      toast.error('Network error. Please try again.', { className: 'toast-vybera' });
      setIsSpinning(false);
    }
  };

  // Called when wheel animation physically finishes
  const handleWheelAnimationComplete = () => {
    setIsSpinning(false);
    setHasSpun(true);
    toast.success(`🎉 Congratulations! You won ${wonReward?.name || 'a Diwali reward'}!`, {
      className: 'toast-vybera',
      duration: 5000,
    });
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Coupon code copied to clipboard!', { className: 'toast-vybera' });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyToCart = async (code, rewardVal, rewardType) => {
    setApplying(true);
    try {
      applyCoupon({
        code,
        value: rewardVal,
        type: rewardType || 'percentage',
        campaignId,
      });
      toast.success('Diwali Coupon applied to your cart!', { className: 'toast-vybera' });
      onClose();
      navigate('/cart');
    } catch {
      toast.error('Failed to apply coupon automatically.');
    } finally {
      setApplying(false);
    }
  };

  const activeCode = couponCode || previousCoupon?.code;
  const activeRewardName = wonReward?.name || previousReward;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSpinning) onClose();
          }}
          className="fixed inset-0 bg-[#241916]/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#FAF5ED] via-[#F3E7D8] to-[#E8D2B5] border-2 border-[#D4AF37] rounded-3xl shadow-[0_20px_70px_rgba(89,9,7,0.45)] p-6 sm:p-8 z-10 overflow-hidden my-auto"
        >
          {/* Top Decorative Border Filigree & Diyas */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#590907] via-[#D4AF37] to-[#590907]" />

          {/* Close Button (X) */}
          <button
            onClick={() => {
              if (!isSpinning) onClose();
            }}
            disabled={isSpinning}
            className="absolute top-4 right-4 z-30 p-2 text-[#75665C] hover:text-[#590907] hover:bg-[#D4AF37]/20 rounded-full transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Admin Preview Badge */}
          {isPreview && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#590907] text-[#FAF5ED] text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 shadow-sm">
              <Sparkles size={11} className="text-[#D4AF37]" />
              Admin Live Preview Mode
            </div>
          )}

          {/* ── Header ────────────────────────────────────────────── */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <DiwaliDiyaIcon size={34} />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#590907] font-display">
                FESTIVAL OF LIGHTS SPECIAL
              </span>
              <DiwaliDiyaIcon size={34} />
            </div>

            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#590907] tracking-wider uppercase mb-1 drop-shadow-xs">
              VYBERA DIWALI DHAMAKA
            </h2>

            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-[1px] w-8 bg-[#D4AF37]" />
              <p className="font-display font-bold text-sm sm:text-base tracking-[0.25em] text-[#30231F] uppercase">
                SPIN. WIN. SLAY.
              </p>
              <div className="h-[1px] w-8 bg-[#D4AF37]" />
            </div>

            <p className="text-xs sm:text-sm text-[#75665C] font-medium tracking-wide">
              Your Diwali surprise is waiting!
            </p>

            {/* Discount Tiers Display */}
            <div className="mt-2.5 inline-block px-4 py-1.5 bg-gradient-to-r from-[#590907]/10 via-[#D4AF37]/25 to-[#590907]/10 border border-[#D4AF37]/60 rounded-full">
              <span className="text-[11px] sm:text-xs font-black tracking-widest text-[#590907] font-mono">
                20% | 30% | 50% | 70% OFF
              </span>
            </div>
          </div>

          {/* ── Content Area: Wheel vs Result ─────────────────────── */}
          {!hasSpun || isSpinning ? (
            <div className="space-y-6">
              {/* The Spin Wheel */}
              <div className="pt-2 pb-2">
                <DiwaliSpinWheel
                  isSpinning={isSpinning}
                  winningIndex={winningIndex}
                  onSpinComplete={handleWheelAnimationComplete}
                  size="compact"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {!user ? (
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/login', { state: { from: window.location.pathname } });
                    }}
                    className="w-full py-4 bg-gradient-to-r from-[#590907] via-[#7B0D0A] to-[#590907] hover:from-[#430605] hover:to-[#430605] text-[#FAF5ED] font-display font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-[#D4AF37]/50"
                  >
                    <LogIn size={16} className="text-[#D4AF37]" />
                    Sign In to Spin & Win
                  </button>
                ) : (
                  <button
                    onClick={handleSpinNow}
                    disabled={isSpinning || loadingCheck}
                    className="w-full py-4 bg-gradient-to-r from-[#590907] via-[#821210] to-[#590907] hover:brightness-110 text-[#FAF5ED] font-display font-black text-base uppercase tracking-widest rounded-2xl shadow-[0_8px_25px_rgba(89,9,7,0.35)] transition-all flex items-center justify-center gap-2 border border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
                  >
                    <Sparkles size={18} className="text-[#FFE57F] animate-spin" style={{ animationDuration: '4s' }} />
                    {isSpinning ? 'SPINNING THE DHAMAKA...' : 'SPIN TO WIN NOW'}
                  </button>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSpinning}
                    className="text-[#75665C] hover:text-[#30231F] font-semibold uppercase tracking-wider underline disabled:opacity-50"
                  >
                    Maybe Later
                  </button>
                  <span className="text-[#75665C] tracking-wide">
                    Limit 1 spin per customer • Free to participate
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ── Won / Already-Spun Screen ──────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 border-2 border-[#D4AF37] rounded-2xl p-6 text-center space-y-5 shadow-inner"
            >
              <div className="inline-flex p-3 bg-gradient-to-br from-[#590907] to-[#D4AF37] rounded-full text-white shadow-md">
                <Award size={36} className="text-[#FFE57F]" />
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-[0.25em] text-[#75665C] uppercase block mb-1">
                  YOUR DIWALI REWARD
                </span>
                <h3 className="font-display font-black text-3xl sm:text-4xl text-[#590907] tracking-wider uppercase">
                  {activeRewardName || 'Diwali Festive Discount'}
                </h3>
                <p className="text-xs text-[#75665C] mt-1 font-medium">
                  {activeRewardName?.includes('FREE TEE')
                    ? 'Our team has logged your VIP Free Tee entry! We will reach out on your order.'
                    : 'Use your single-use code below at checkout for instant savings.'}
                </p>
              </div>

              {/* Coupon Box */}
              {activeCode ? (
                <div className="p-4 bg-gradient-to-r from-[#FAF5ED] to-[#F3E7D8] border-2 border-dashed border-[#D4AF37] rounded-xl space-y-2">
                  <span className="text-[10px] text-[#75665C] uppercase font-bold tracking-widest block">
                    Your Exclusive Coupon Code
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl font-black text-[#590907] tracking-widest">
                      {activeCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(activeCode)}
                      className="p-2 border border-[#D4AF37] bg-white rounded-lg text-[#590907] hover:bg-[#590907] hover:text-white transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#75665C] block">
                    Saved in your account under <Link to="/dashboard/coupons" className="underline font-bold text-[#590907]" onClick={onClose}>My Coupons</Link>
                  </span>
                </div>
              ) : null}

              {/* Buttons */}
              <div className="space-y-2.5 pt-2">
                {activeCode && (
                  <button
                    onClick={() => {
                      const numVal = parseInt(activeRewardName) || 20;
                      handleApplyToCart(activeCode, numVal, 'percentage');
                    }}
                    disabled={applying}
                    className="w-full py-3.5 bg-[#590907] hover:bg-[#430605] text-[#FAF5ED] font-display font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-[#D4AF37]"
                  >
                    <ShoppingCart size={15} />
                    Apply Code & View Cart
                  </button>
                )}

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/shop');
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-[#590907] hover:underline"
                  >
                    Shop Diwali Collection →
                  </button>
                  <span className="text-[#D4BEA5]">•</span>
                  <button
                    onClick={onClose}
                    className="text-xs font-medium text-[#75665C] hover:text-[#30231F]"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Subtle Note */}
          <div className="mt-4 pt-3 border-t border-[#D4BEA5]/60 flex items-center justify-center gap-2 text-[10px] text-[#75665C]">
            <DiwaliDiyaIcon size={14} />
            <span>Valid 7 Nov – 20 Nov 2026 IST • Terms & conditions apply</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DiwaliSpinModal;
