import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle, AlertCircle, Loader2, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, updateOrderPayment } from '../firebase/orders';
import { getUserProfile, updateUserProfile } from '../firebase/users';
import { getRewardSettings } from '../firebase/rewards';
import { openRazorpay } from '../utils/razorpay';
import { trackBeginCheckout, trackPurchase } from '../utils/analytics';
import { validateName, validatePhone, sanitizeName, sanitizePhone } from '../utils/validation';
import toast from 'react-hot-toast';
import { getUserCoupons } from '../firebase/coupons';
import BackButton from '../components/ui/BackButton';
import { getProductPricing } from '../utils/pricing';

const PLACEHOLDER = 'https://placehold.co/80x100/141414/888888?text=NX';

// ─── Step Indicator ──────────────────────────────────────────────
const StepIndicator = ({ step }) => (
  <div className="flex items-center gap-2 mb-10">
    {['Details', 'Review', 'Pay'].map((label, i) => (
      <div key={label} className="flex items-center">
        <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-[#30231F]' : 'text-[#75665C]'}`}>
          <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
            i + 1 < step ? 'bg-[#590907] border-[#590907] text-white' :
            i + 1 === step ? 'border-[#590907] text-[#590907] bg-white ring-2 ring-[#590907]/20' :
            'border-[#D4BEA5] text-[#75665C] bg-[#FAF5ED]'
          }`}>
            {i + 1 < step ? '✓' : i + 1}
          </div>
          <span className={`text-xs tracking-widest uppercase hidden sm:block ${i + 1 === step ? 'font-bold text-[#30231F]' : 'font-medium'}`}>{label}</span>
        </div>
        {i < 2 && <div className={`w-8 sm:w-16 h-px mx-3 transition-colors duration-500 ${i + 1 < step ? 'bg-[#590907]' : 'bg-[#D4BEA5]'}`} />}
      </div>
    ))}
  </div>
);

// ─── Form Field ──────────────────────────────────────────────────
const Field = ({ label, name, value, onChange, type = 'text', placeholder, maxLength, colSpan = 1 }) => (
  <div className={colSpan === 2 ? 'md:col-span-2' : ''}>
    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className="vy-input"
    />
  </div>
);

// ─── Order Summary Panel ─────────────────────────────────────────
const OrderSummaryPanel = ({ 
  items, 
  coupon, 
  discount, 
  subtotal, 
  total, 
  campaign, 
  compact = false, 
  userCoupons = [], 
  applyCoupon, 
  removeCoupon 
}) => (
  <div className={`bg-[#FAF5ED] border border-[#D4BEA5] shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
    {!compact && (
      <h2 className="text-[#30231F] font-bold tracking-widest uppercase text-sm mb-6">Order Summary</h2>
    )}

    {/* Items */}
    <div className="space-y-3 mb-4 pb-4 border-b border-[#D4BEA5]">
      {items.map(item => (
        <div key={item.cartId || `${item.id}-${item.size}-${item.selectedColor}`} className="flex gap-3 items-center">
          <img
            src={item.image || PLACEHOLDER}
            alt={item.name}
            className="w-12 h-14 object-cover bg-white border border-[#D4BEA5] flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[#30231F] text-xs font-bold truncate">{item.name}</p>
            <p className="text-[#75665C] text-xs">
              Size: {item.size}
              {item.selectedColor && ` | Color: ${item.selectedColor}`}
              {item.fit && ` | Fit: ${item.fit}`}
              {' '}× {item.quantity}
            </p>
          </div>
          <span className="text-[#590907] text-xs font-bold font-mono flex-shrink-0">
            ₹{(getProductPricing(item, campaign).price * item.quantity).toLocaleString()}
          </span>
        </div>
      ))}
    </div>

    {/* Price breakdown */}
    <div className="space-y-2.5 mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-[#75665C]">Subtotal</span>
        <span className="text-[#30231F] font-bold font-mono">₹{subtotal.toLocaleString()}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle size={12} />
            Coupon {coupon?.code && `(${coupon.code})`}
          </span>
          <span className="text-emerald-700 font-bold font-mono">−₹{discount.toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-[#75665C]">Shipping</span>
        <span className="text-emerald-700 font-bold">Free</span>
      </div>
    </div>

    <div className="flex justify-between items-baseline border-t border-[#D4BEA5] pt-4">
      <span className="text-[#30231F] font-bold text-sm uppercase tracking-wider">Total</span>
      <span className="text-[#590907] font-bold text-xl font-mono">₹{total.toLocaleString()}</span>
    </div>

    {/* Available Coupons list */}
    {!compact && userCoupons.length > 0 && (
      <div className="mt-6 pt-4 border-t border-[#D4BEA5]">
        <label className="text-[#75665C] text-[10px] uppercase tracking-widest block mb-2 font-bold">Your Unused Reward Coupons</label>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {userCoupons.map(cp => {
            const isApplied = coupon?.code === cp.code;
            return (
              <div 
                key={cp.id}
                onClick={() => isApplied ? removeCoupon() : applyCoupon(cp)}
                className={`p-3 border cursor-pointer flex items-center justify-between transition-colors ${
                  isApplied ? 'border-emerald-600 bg-emerald-50' : 'border-[#D4BEA5] hover:border-[#590907] bg-white'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[#590907] text-[11px] font-bold">{cp.code}</span>
                    <span className="text-[9px] px-1 bg-[#590907]/10 text-[#590907] font-bold uppercase tracking-wider">{cp.value}{cp.type === 'percentage' ? '%' : ' OFF'}</span>
                  </div>
                  {cp.minOrder && <p className="text-[10px] text-[#75665C] mt-0.5 font-medium">Min. order ₹{cp.minOrder}</p>}
                </div>
                <button
                  type="button"
                  className={`text-[10px] uppercase tracking-widest font-bold ${isApplied ? 'text-rose-700' : 'text-[#590907]'}`}
                >
                  {isApplied ? 'Remove' : 'Apply'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

// ─── Main Checkout Page ──────────────────────────────────────────
const Checkout = () => {
  const { items, coupon, discount, subtotal, total, clearCart, campaign, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from || '/';
  const [apiHealth, setApiHealth] = useState('checking'); // checking | ok | error
  const [userCoupons, setUserCoupons] = useState([]);

  const [step, setStep] = useState(1); // 1: Details, 2: Review, 3: Processing
  const [paymentState, setPaymentState] = useState('idle'); // idle | loading | success | failed

  const [form, setForm] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});

  const [rewardPoints, setRewardPoints] = useState(0);
  const [useRewards, setUseRewards] = useState(false);
  const [rewardsSettings, setRewardsSettings] = useState({ enabled: true, minPayable: 99, redemptionRate: 1 });

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(profile => {
        if (profile) {
          if (profile.savedAddress) {
            setForm(f => ({
              ...f,
              ...profile.savedAddress,
              name: f.name || profile.savedAddress.name,
              email: f.email || profile.savedAddress.email
            }));
          }
          if (profile.rewardPoints !== undefined) {
            setRewardPoints(profile.rewardPoints);
          }
        }
      });
      getRewardSettings().then(setRewardsSettings).catch(console.error);
    }
  }, [user]);

  // Fetch user unused reward coupons and auto-apply the highest value one
  useEffect(() => {
    if (user) {
      getUserCoupons(user.uid).then(cps => {
        setUserCoupons(cps);
        if (!coupon && cps.length > 0) {
          let bestCoupon = null;
          let maxDiscount = 0;
          cps.forEach(cp => {
            let discountVal = 0;
            if (!cp.minOrder || subtotal >= cp.minOrder) {
              if (cp.type === 'percentage') {
                discountVal = (subtotal * cp.value) / 100;
                if (cp.maxDiscount) discountVal = Math.min(discountVal, cp.maxDiscount);
              } else {
                discountVal = cp.value;
              }
            }
            if (discountVal > maxDiscount) {
              maxDiscount = discountVal;
              bestCoupon = cp;
            }
          });
          
          if (bestCoupon) {
            applyCoupon(bestCoupon);
            toast.success(`Best reward coupon '${bestCoupon.code}' auto-applied! Saving ₹${Math.round(maxDiscount)}.`, { className: 'toast-vybera' });
          }
        }
      }).catch(console.error);
    }
  }, [user, subtotal]);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? setApiHealth('ok') : setApiHealth('error'))
      .catch(() => setApiHealth('error'));
  }, []);

  const onChange = e => {
    const { name, value } = e.target;
    let sanitized = value;
    // Real-time sanitization for name and phone
    if (name === 'name') sanitized = sanitizeName(value);
    if (name === 'phone') sanitized = sanitizePhone(value);
    setForm(f => ({ ...f, [name]: sanitized }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    const safeName = String(form.name || '');
    const safeEmail = String(form.email || '');
    const safePhone = String(form.phone || '');
    const safeAddress = String(form.address || '');
    const safeCity = String(form.city || '');
    const safeState = String(form.state || '');
    const safePincode = String(form.pincode || '');

    const pincodeDigits = safePincode.replace(/\D/g, '');

    // Name: letters and spaces only
    const nameErr = validateName(safeName);
    if (nameErr) newErrors.name = nameErr;

    if (!safeEmail.trim() || !/\S+@\S+\.\S+/.test(safeEmail)) newErrors.email = 'Valid email required';

    // Phone: Indian mobile validation (starts with 6-9, exactly 10 digits)
    const phoneErr = validatePhone(safePhone);
    if (phoneErr) newErrors.phone = phoneErr;

    if (!safeAddress.trim()) newErrors.address = 'Address is required';
    if (!safeCity.trim()) newErrors.city = 'City is required';
    if (!safeState.trim()) newErrors.state = 'State is required';
    if (!pincodeDigits || pincodeDigits.length !== 6) newErrors.pincode = '6-digit pincode required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) {
      toast.error('Please fix the errors below.', { className: 'toast-vybera' });
      return;
    }
    if (!user) {
      toast.error('Please sign in to continue.', { className: 'toast-vybera' });
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    try {
      if (saveAddress && user) {
        await updateUserProfile(user.uid, { savedAddress: form });
      }
    } catch (err) {
      console.error('Failed to save address:', err);
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Payment ──────────────────────────────────────────────────
  const handlePayment = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty.', { className: 'toast-vybera' });
      return;
    }

    if (!user) {
      toast.error('Please sign in to place your order.', { className: 'toast-vybera' });
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    const maxDiscountAllowed = Math.max(0, total - rewardsSettings.minPayable);
    const maxPointsValue = rewardPoints * rewardsSettings.redemptionRate;
    const availablePointsToUse = rewardsSettings.enabled && useRewards 
      ? Math.min(maxPointsValue, maxDiscountAllowed) 
      : 0;
    
    const finalTotal = total - availablePointsToUse;
    const pointsRedeemed = availablePointsToUse / rewardsSettings.redemptionRate;

    setPaymentState('loading');
    setStep(3);

    try {
      // Refresh user authentication token before checkout
      let idToken;
      try {
        idToken = await user.getIdToken(true);
      } catch (tokenErr) {
        console.error('Failed to get auth token:', tokenErr);
      }

      if (!idToken) {
        setPaymentState('idle');
        setStep(2);
        toast.error('Session expired. Please log in again.', { className: 'toast-vybera' });
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }

      const receipt = `vybera_${user.uid.slice(0, 8)}_${Date.now()}`;
      
      // ─── STAGE 1: Create PENDING order first ───
      const orderData = {
        userId: user.uid,
        userEmail: user.email || null,
        customerName: form.name || '',
        customerPhone: form.phone || '',
        products: items.map(i => ({
          id: i.id || 'unknown',
          name: i.name || 'Unknown Product',
          price: i.price || 0,
          quantity: i.quantity || 1,
          size: i.size || 'N/A',
          image: i.image || '',
          isDrop: i.isDrop || false,
          selectedColor: i.selectedColor || null,
          isCustom: i.isCustom || false,
          position: i.position || null,
          imageUrls: i.imageUrls || [],
          description: i.description || null,
          designStatus: i.designStatus || null,
          fit: i.fit || null,
        })),
        address: {
          name: form.name || '',
          email: form.email || '',
          phone: form.phone || '',
          address: form.address || '',
          city: form.city || '',
          state: form.state || '',
          pincode: form.pincode || '',
        },
        subtotal: subtotal || 0,
        discount: discount || 0,
        total: finalTotal,
        originalTotal: total,
        pointsDiscount: availablePointsToUse,
        couponCode: coupon?.code || null,
        pointsRedeemed: pointsRedeemed || 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentReceipt: receipt,
      };

      // ── 0-Rupee Bypass (100% Free via Coupon/Rewards) ──
      if (finalTotal === 0) {
        setPaymentState('loading');
        try {
          const orderId = await createOrder({ ...orderData, status: 'pending', paymentStatus: 'unpaid' });
          
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpay_order_id: 'free_coupon_bypass',
              razorpay_payment_id: 'free_coupon_bypass',
              razorpay_signature: 'free_coupon_bypass',
              firebase_order_id: orderId
            })
          });

          const resData = await response.json();

          if (!response.ok) {
            toast.error(resData.error || 'Failed to verify free order.');
            setPaymentState('failed');
            return;
          }

          clearCart();
          setPaymentState('success');
          setTimeout(() => navigate('/order-success'), 800);
        } catch (err) {
          console.error(err);
          toast.error('Error confirming free order.');
          setPaymentState('failed');
        }
        return;
      }

      // Create the pending order in DB
      const orderId = await createOrder(orderData);

      // Store order ID for UPI redirect recovery (SPA state is lost on redirect)
      localStorage.setItem('vybera_pending_order', orderId);

      await openRazorpay({
        firebaseOrderId: orderId,
        idToken,
        receipt,
        description: `VYBERA Order — ${items.length} item${items.length > 1 ? 's' : ''}`,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },

        onSuccess: async (response) => {
          try {
            // ─── STAGE 2: Verify payment signature securely on the backend ───
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || response.backendOrderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                firebase_order_id: orderId
              })
            });

            if (!verifyRes.ok) {
              const errorData = await verifyRes.json().catch(() => ({}));
              throw new Error(errorData.error || 'Payment verification failed');
            }

            clearCart();
            localStorage.removeItem('vybera_pending_order');
            trackPurchase(response.razorpay_payment_id, total, items);
            setPaymentState('success');
            setTimeout(() => navigate('/order-success'), 800);

          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setPaymentState('failed');
            setStep(2);
            toast.error(verifyErr.message || 'Payment verification failed. If money was deducted, please contact support.', { className: 'toast-vybera' });
          }
        },

        onFailure: (error) => {
          console.error('Razorpay payment failed:', error);
          setPaymentState('failed');
          setStep(2); // Go back to review step
          const msg = error?.message || error?.description || (error?.reason === 'backend_failure' ? 'Payment order creation failed on server. Please try again.' : error?.reason) || 'Payment was not completed.';
          toast.error(msg, { className: 'toast-vybera' });
        },
      });

    } catch (err) {
      console.error('Payment initiation error:', err);
      setPaymentState('failed');
      setStep(2);
      toast.error(err.message || 'Failed to initiate payment.', { className: 'toast-vybera' });
    }
  };

  // ── Empty cart guard ─────────────────────────────────────────
  if (items.length === 0 && paymentState !== 'success') {
    return (
      <div className="min-h-screen bg-[#F3E7D8] pt-24 flex flex-col items-center justify-center gap-6 px-6 relative">
        <BackButton className="absolute top-24 left-6 md:left-12" />
        <ShoppingBag size={48} className="text-[#D4BEA5]" />
        <h2 className="font-display font-bold text-2xl tracking-wider text-[#30231F]">No items in cart</h2>
        <Link to="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3E7D8] pt-24">
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-8 border-b border-[#D4BEA5] pb-6">
            Checkout
          </h1>
          <StepIndicator step={Math.min(step, 2)} />
        </motion.div>

        {/* ── Processing / Loading ─────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 3 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-6 text-center"
            >
              {paymentState === 'loading' && (
                <>
                  <Loader2 size={48} className="text-[#590907] animate-spin" />
                  <div>
                    <h2 className="text-[#30231F] font-bold text-xl tracking-wider mb-2">
                      Processing Payment
                    </h2>
                    <p className="text-[#75665C] text-sm font-medium">
                      Complete the payment in the Razorpay window…
                    </p>
                  </div>
                </>
              )}
              {paymentState === 'success' && (
                <>
                  <CheckCircle size={64} className="text-emerald-600" />
                  <div>
                    <h2 className="text-[#30231F] font-bold text-xl tracking-wider mb-2">
                      Payment Successful!
                    </h2>
                    <p className="text-[#75665C] text-sm font-medium">Redirecting you to order confirmation…</p>
                  </div>
                </>
              )}
              {paymentState === 'failed' && (
                <>
                  <AlertCircle size={48} className="text-rose-600" />
                  <div>
                    <h2 className="text-[#30231F] font-bold text-xl tracking-wider mb-2">
                      Payment Failed
                    </h2>
                    <p className="text-[#75665C] text-sm mb-6 font-medium">Going back to order review…</p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Step 1: Delivery Details ──────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* Form */}
              <div className="lg:col-span-2">
                <h2 className="text-[#30231F] text-xs font-bold tracking-widest uppercase mb-6">
                  Delivery Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={errors.name ? 'relative' : ''}>
                    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">Full Name *</label>
                    <input name="name" value={form.name} onChange={onChange} className={`vy-input ${errors.name ? 'border-red-500/60' : ''}`} placeholder="Letters only" />
                    {errors.name && <p className="text-rose-700 text-xs mt-1 font-medium">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={onChange} className={`vy-input ${errors.email ? 'border-red-500/60' : ''}`} placeholder="you@example.com" />
                    {errors.email && <p className="text-rose-700 text-xs mt-1 font-medium">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">Mobile Number *</label>
                    <div className="relative flex">
                      <div className="flex items-center gap-1.5 px-3 border border-[#D4BEA5] border-r-0 bg-[#FAF5ED] text-[#30231F] text-sm select-none shrink-0 font-bold">
                        <Phone size={13} className="text-[#75665C]" />
                        <span className="text-xs font-medium tracking-wider">+91</span>
                      </div>
                      <input name="phone" type="tel" inputMode="numeric" value={form.phone} onChange={onChange} className={`vy-input flex-1 ${errors.phone ? 'border-red-500/60' : ''}`} placeholder="9876543210" maxLength={10} />
                    </div>
                    {errors.phone && <p className="text-rose-700 text-xs mt-1 font-medium">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">Pincode *</label>
                    <input name="pincode" value={form.pincode} onChange={onChange} className={`vy-input ${errors.pincode ? 'border-red-500/60' : ''}`} placeholder="6-digit pincode" maxLength={6} />
                    {errors.pincode && <p className="text-rose-700 text-xs mt-1 font-medium">{errors.pincode}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">Street Address *</label>
                    <input name="address" value={form.address} onChange={onChange} className={`vy-input ${errors.address ? 'border-red-500/60' : ''}`} placeholder="House no., Street, Landmark" />
                    {errors.address && <p className="text-rose-700 text-xs mt-1 font-medium">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">City *</label>
                    <input name="city" value={form.city} onChange={onChange} className={`vy-input ${errors.city ? 'border-red-500/60' : ''}`} placeholder="Mumbai" />
                    {errors.city && <p className="text-rose-700 text-xs mt-1 font-medium">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">State *</label>
                    <input name="state" value={form.state} onChange={onChange} className={`vy-input ${errors.state ? 'border-red-500/60' : ''}`} placeholder="Maharashtra" />
                    {errors.state && <p className="text-rose-700 text-xs mt-1 font-medium">{errors.state}</p>}
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="w-5 h-5 appearance-none border border-[#D4BEA5] bg-white rounded-none checked:bg-[#590907] transition-all cursor-pointer"
                        />
                        {saveAddress && <CheckCircle size={12} className="absolute text-white pointer-events-none" />}
                      </div>
                      <span className="text-[#75665C] text-xs uppercase tracking-widest group-hover:text-[#30231F] transition-colors font-medium">
                        Save this address for future purchases
                      </span>
                    </label>
                  </div>
                </div>

                {!user && (
                  <div className="mt-6 p-4 border border-amber-400 bg-amber-50">
                    <p className="text-amber-900 text-xs font-medium">
                      You need to{' '}
                      <Link to="/login" className="underline font-bold text-[#590907]">sign in</Link>
                      {' '}before completing payment.
                    </p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  className="btn-primary mt-8 flex items-center gap-2"
                >
                  Continue to Review →
                </motion.button>
              </div>

              <div className="hidden lg:block h-fit lg:sticky lg:top-24">
                <OrderSummaryPanel
                  items={items}
                  coupon={coupon}
                  discount={discount}
                  subtotal={subtotal}
                  total={total}
                  campaign={campaign}
                  userCoupons={userCoupons}
                  applyCoupon={applyCoupon}
                  removeCoupon={removeCoupon}
                />
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Review & Pay ──────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* Left: Address review */}
              <div className="lg:col-span-2 space-y-6">
                {/* Delivery info review */}
                <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[#30231F] text-xs font-bold tracking-widest uppercase">
                      Delivering To
                    </h2>
                    <button
                      onClick={() => setStep(1)}
                      className="text-[#590907] text-xs tracking-widest uppercase hover:underline font-bold transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#30231F] text-sm font-bold">{form.name}</p>
                    <p className="text-[#75665C] text-sm">{form.address}</p>
                    <p className="text-[#75665C] text-sm">{form.city}, {form.state} — {form.pincode}</p>
                    <p className="text-[#75665C] text-sm">{form.phone} · {form.email}</p>
                  </div>
                </div>

                <div className="lg:hidden">
                  <OrderSummaryPanel
                    items={items}
                    coupon={coupon}
                    discount={discount}
                    subtotal={subtotal}
                    total={total}
                    campaign={campaign}
                    compact
                    userCoupons={userCoupons}
                    applyCoupon={applyCoupon}
                    removeCoupon={removeCoupon}
                  />
                </div>
              </div>

              {/* Right: Pay panel */}
              <div className="h-fit lg:sticky lg:top-24 space-y-4">
                <div className="hidden lg:block">
                  <OrderSummaryPanel
                    items={items}
                    coupon={coupon}
                    discount={discount}
                    subtotal={subtotal}
                    total={total}
                    campaign={campaign}
                    userCoupons={userCoupons}
                    applyCoupon={applyCoupon}
                    removeCoupon={removeCoupon}
                  />
                </div>

                {/* Razorpay Pay Button */}
                <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
                  {/* Coupon confirmation */}
                  {discount > 0 && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-300">
                      <CheckCircle size={14} className="text-emerald-700 flex-shrink-0" />
                      <div>
                        <p className="text-emerald-800 text-xs font-bold">
                          Coupon {coupon?.code} applied
                        </p>
                        <p className="text-emerald-700 text-xs font-semibold font-mono">
                          You save ₹{discount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rewards Toggle */}
                  {rewardsSettings.enabled && rewardPoints > 0 && Math.max(0, total - rewardsSettings.minPayable) > 0 && (
                    <div className="mb-6 p-4 bg-[#F3E7D8] border border-[#D4BEA5]">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input 
                            type="checkbox" 
                            checked={useRewards}
                            onChange={(e) => setUseRewards(e.target.checked)}
                            className="w-5 h-5 appearance-none border border-[#D4BEA5] bg-white rounded-none checked:bg-[#590907] transition-all cursor-pointer"
                          />
                          {useRewards && <CheckCircle size={12} className="absolute text-white pointer-events-none" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[#30231F] text-sm font-bold tracking-wider">
                            Use VYBERA Rewards
                          </p>
                          <p className="text-[#75665C] text-xs mt-1 font-medium">
                            Balance: {rewardPoints} Points (₹{rewardPoints * rewardsSettings.redemptionRate})
                          </p>
                          {useRewards && (rewardsSettings.enabled ? Math.min(rewardPoints * rewardsSettings.redemptionRate, Math.max(0, total - rewardsSettings.minPayable)) : 0) > 0 && (
                            <p className="text-emerald-700 text-xs mt-2 font-bold font-mono">
                              Applying {(rewardsSettings.enabled ? Math.min(rewardPoints * rewardsSettings.redemptionRate, Math.max(0, total - rewardsSettings.minPayable)) : 0) / rewardsSettings.redemptionRate} Points for ₹{rewardsSettings.enabled ? Math.min(rewardPoints * rewardsSettings.redemptionRate, Math.max(0, total - rewardsSettings.minPayable)) : 0} discount.
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Secure badge */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-px h-6 bg-[#D4BEA5]" />
                    <div className="flex items-center gap-2">
                      <span className="text-[#75665C] text-xs">Secured by</span>
                      <span className="text-[#30231F] text-xs font-bold tracking-widest">RAZORPAY</span>
                    </div>
                  </div>

                  {/* Final amount */}
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="text-[#75665C] text-sm font-semibold">You pay</span>
                    <div className="text-right">
                      <span className="text-[#590907] font-bold text-2xl font-mono">
                        ₹{(total - (rewardsSettings.enabled && useRewards ? Math.min(rewardPoints * rewardsSettings.redemptionRate, Math.max(0, total - rewardsSettings.minPayable)) : 0)).toLocaleString()}
                      </span>
                      {(discount > 0 || (rewardsSettings.enabled && useRewards)) && (
                        <p className="text-[#75665C] text-xs line-through font-mono">
                          ₹{subtotal.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {apiHealth === 'error' && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-300 flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-700 shrink-0" />
                      <p className="text-rose-800 text-[10px] uppercase font-bold tracking-widest">
                        Payment System Offline. Please refresh or try again later.
                      </p>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment}
                    disabled={paymentState === 'loading'}
                    className="btn-primary w-full flex items-center justify-center gap-3 text-sm py-4 disabled:opacity-50"
                  >
                    Pay ₹{(total - (rewardsSettings.enabled && useRewards ? Math.min(rewardPoints * rewardsSettings.redemptionRate, Math.max(0, total - rewardsSettings.minPayable)) : 0)).toLocaleString()} with Razorpay
                  </motion.button>

                  <p className="text-[#75665C] text-[10px] text-center mt-3 tracking-wide">
                    By clicking Pay, you agree to our Terms. Your card data is never stored by VYBERA.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Checkout;
