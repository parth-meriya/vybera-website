import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn, Phone, Ticket, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getUserProfile } from '../../firebase/users';
import SVGSpinWheel from '../../components/campaign/SpinWheel';
import BackButton from '../../components/ui/BackButton';

const Campaign = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { applyCoupon } = useCart();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  
  const [userProfile, setUserProfile] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState(null);
  const [reward, setReward] = useState(null);
  const [couponCode, setCouponCode] = useState(null);

  // 1. Validate Access Token (QR Scan)
  useEffect(() => {
    const token = searchParams.get('token');
    const sessionKey = `vybera_campaign_${id}`;
    
    if (token) {
      sessionStorage.setItem(sessionKey, token);
      setHasAccess(true);
      // Clean up URL so it's clean and doesn't get shared with token easily
      window.history.replaceState({}, '', `/campaign/${id}`);
    } else {
      const storedToken = sessionStorage.getItem(sessionKey);
      if (storedToken) {
        setHasAccess(true);
      } else {
        setLoading(false);
      }
    }
  }, [id, searchParams]);

  // 2. Fetch Campaign Details & User Profile
  useEffect(() => {
    const fetchInit = async () => {
      if (!hasAccess) return;
      try {
        const docRef = doc(db, 'campaigns', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          if (docSnap.data().active) {
            setCampaign(docSnap.data());
          } else {
            setCampaign({ _inactive: true });
            toast.error('This campaign is currently paused.', { className: 'toast-vybera' });
          }
        } else {
          toast.error('This campaign does not exist.', { className: 'toast-vybera' });
        }

        if (user) {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching campaign init data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInit();
  }, [hasAccess, id, user]);

  const handleAuthRedirect = () => {
    // Redirect to login, but ensure they come back here
    navigate('/login', { state: { from: `/campaign/${id}` } });
  };

  const handleOnboardingRedirect = () => {
    // If they have an account but no mobile number
    navigate('/onboarding', { state: { from: `/campaign/${id}` } });
  };

  const spin = async () => {
    if (isSpinning) return;
    
    try {
      setIsSpinning(true);
      const idToken = await auth.currentUser?.getIdToken();

      const response = await fetch('/api/campaign/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ campaignId: id })
      });

      const data = await response.json();

      if (!response.ok) {
        setIsSpinning(false);
        if (data.needsPhone) {
           handleOnboardingRedirect();
        } else {
           toast.error(data.error || 'Failed to spin the wheel.', { className: 'toast-vybera' });
        }
        return;
      }

      // Backend returned success and the winning reward
      setWinningIndex(data.reward.index);
      setReward(data.reward);
      setCouponCode(data.couponCode); // Could be null for FREE TEE

      if (data.couponCode) {
        applyCoupon({
          code: data.couponCode,
          type: data.reward.type,
          value: data.reward.value,
          singleUse: true,
          minOrder: 0
        });
        toast.success(`Coupon automatically applied to your cart!`, { className: 'toast-vybera' });
      }

    } catch (err) {
      console.error(err);
      toast.error('Network error while spinning.', { className: 'toast-vybera' });
      setIsSpinning(false);
    }
  };

  const onSpinComplete = () => {
    setIsSpinning(false);
    // Show confetti or modal
    // For now, the UI will just display the reward div below the wheel
  };

  const handleCopy = () => {
    if (couponCode) {
      navigator.clipboard.writeText(couponCode);
      toast.success('Coupon code copied!', { className: 'toast-vybera' });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-vy-black flex items-center justify-center">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 px-6 flex flex-col items-center justify-center text-center relative">
        <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
        <BackButton className="absolute top-24 left-6" />
        <Lock size={64} className="text-vy-border mb-6" />
        <h1 className="font-display text-2xl font-bold text-vy-white mb-2">ACCESS DENIED</h1>
        <p className="text-vy-grey text-sm">This is a secret campaign. You can only access it via an exclusive QR code.</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex items-center justify-center text-center">
        <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
        <p className="text-vy-grey">Campaign not found.</p>
      </div>
    );
  }

  if (campaign._inactive) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex flex-col items-center justify-center text-center">
        <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
        <p className="text-vy-yellow font-display text-xl tracking-widest uppercase">Campaign Paused</p>
        <p className="text-vy-grey mt-2 text-sm">This campaign is temporarily inactive. Please check back later.</p>
      </div>
    );
  }

  const needsMobile = user && (!userProfile || !userProfile.phoneNumber);

  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-12 relative overflow-hidden">
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      
      {/* Background Banner */}
      {campaign.bannerUrl && (
        <div className="absolute top-0 left-0 w-full h-96 opacity-20 pointer-events-none">
          <img src={campaign.bannerUrl} alt="Campaign Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-vy-black" />
        </div>
      )}

      <div className="max-w-screen-md mx-auto px-6 relative z-10 text-center pt-8">
        <BackButton className="absolute top-0 left-6" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-vy-gold tracking-widest uppercase mb-4 drop-shadow-[0_0_15px_rgba(196,160,107,0.5)]">
            SECRET VYBERA REWARD
          </h1>
          <p className="text-vy-white/80 text-sm tracking-wide max-w-md mx-auto">
            You've unlocked the hidden {campaign.id.replace('-', ' ')} campaign. Spin the wheel for a chance to win exclusive rewards.
          </p>
        </motion.div>

        {/* The Spin Wheel */}
        <div className="mb-12">
          <SVGSpinWheel 
            isSpinning={isSpinning} 
            winningIndex={winningIndex} 
            onSpinComplete={onSpinComplete} 
          />
        </div>

        {/* Result Area */}
        <AnimatePresence>
          {reward && !isSpinning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="mb-8 p-6 border-2 border-vy-gold bg-vy-card/80 backdrop-blur"
            >
              <h2 className="text-vy-gold font-display font-bold text-2xl tracking-widest uppercase mb-2">
                YOU WON {reward.name}!
              </h2>
              {couponCode ? (
                <div className="bg-vy-black/40 p-6 rounded-md border border-vy-border shadow-lg">
                  <p className="text-vy-white text-sm mb-2 font-bold tracking-wide">Coupon has been applied to your cart!</p>
                  <p className="text-vy-grey text-xs mb-6">You can also copy it to use later (Single Use):</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="text-vy-black bg-vy-gold px-6 py-3 font-mono font-bold tracking-widest text-xl select-all rounded-sm shadow-md w-full sm:w-auto">
                      {couponCode}
                    </span>
                    <button 
                      onClick={handleCopy}
                      className="bg-vy-white text-vy-black px-6 py-3 hover:bg-vy-accent transition-colors rounded-sm shadow-md font-bold text-sm tracking-widest flex items-center justify-center gap-2 w-full sm:w-auto"
                      title="Copy Code"
                    >
                      <Copy size={16} /> COPY
                    </button>
                  </div>
                  <p className="text-vy-grey text-[10px] mt-6 uppercase tracking-widest">
                    Code has been saved to your profile rewards.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-vy-white text-sm mb-4">
                    Our team will contact you on your registered mobile number to arrange the delivery of your FREE TEE.
                  </p>
                  <p className="text-vy-grey text-[10px] uppercase tracking-widest">
                    Status available in your profile dashboard.
                  </p>
                </div>
              )}
              
              <button onClick={() => navigate('/shop')} className="btn-primary mt-6">
                Shop Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Area */}
        {!reward && (
          <div className="flex flex-col items-center gap-4">
            {!user ? (
              <button onClick={handleAuthRedirect} className="btn-primary flex items-center gap-3 w-full sm:w-auto">
                <LogIn size={18} />
                Sign In to Spin
              </button>
            ) : needsMobile ? (
              <div className="text-center">
                <p className="text-vy-yellow text-xs mb-3">Mobile number required to participate.</p>
                <button onClick={handleOnboardingRedirect} className="btn-primary flex items-center gap-3 w-full sm:w-auto">
                  <Phone size={18} />
                  Complete Profile
                </button>
              </div>
            ) : (
              <button 
                onClick={spin} 
                disabled={isSpinning}
                className="bg-vy-gold hover:bg-vy-white text-vy-black font-display font-bold text-xl uppercase tracking-widest px-12 py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(196,160,107,0.3)] hover:shadow-[0_0_40px_rgba(196,160,107,0.6)]"
              >
                {isSpinning ? 'SPINNING...' : 'SPIN TO WIN'}
              </button>
            )}
            <p className="text-vy-grey/50 text-[10px] uppercase tracking-widest mt-2">
              Limit 1 spin per account & mobile number.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Campaign;
