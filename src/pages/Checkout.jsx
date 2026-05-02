import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../firebase/orders';
import { openRazorpay } from '../utils/razorpay';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://placehold.co/80x100/141414/888888?text=NX';

// ─── Step Indicator ──────────────────────────────────────────────
const StepIndicator = ({ step }) => (
  <div className="flex items-center gap-2 mb-10">
    {['Details', 'Review', 'Pay'].map((label, i) => (
      <div key={label} className="flex items-center">
        <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-vy-white' : 'text-vy-border'}`}>
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
            i + 1 < step ? 'bg-vy-white border-vy-white text-vy-black' :
            i + 1 === step ? 'border-vy-white text-vy-white' :
            'border-vy-border text-vy-border'
          }`}>
            {i + 1 < step ? '✓' : i + 1}
          </div>
          <span className="text-xs tracking-widest uppercase hidden sm:block">{label}</span>
        </div>
        {i < 2 && <div className={`w-8 sm:w-16 h-px mx-3 transition-colors duration-500 ${i + 1 < step ? 'bg-vy-white' : 'bg-vy-border'}`} />}
      </div>
    ))}
  </div>
);

// ─── Form Field ──────────────────────────────────────────────────
const Field = ({ label, name, value, onChange, type = 'text', placeholder, maxLength, colSpan = 1 }) => (
  <div className={colSpan === 2 ? 'md:col-span-2' : ''}>
    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">{label}</label>
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
const OrderSummaryPanel = ({ items, coupon, discount, subtotal, total, compact = false }) => (
  <div className={`bg-vy-card border border-vy-border ${compact ? 'p-4' : 'p-6'}`}>
    {!compact && (
      <h2 className="text-vy-white font-semibold tracking-widest uppercase text-sm mb-6">Order Summary</h2>
    )}

    {/* Items */}
    <div className="space-y-3 mb-4 pb-4 border-b border-vy-border">
      {items.map(item => (
        <div key={`${item.id}-${item.size}`} className="flex gap-3 items-center">
          <img
            src={item.image || PLACEHOLDER}
            alt={item.name}
            className="w-10 h-12 object-cover bg-vy-dark flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-vy-white text-xs font-medium truncate">{item.name}</p>
            <p className="text-vy-grey text-xs">Size: {item.size} × {item.quantity}</p>
          </div>
          <span className="text-vy-white text-xs font-semibold flex-shrink-0">
            ₹{(item.price * item.quantity).toLocaleString()}
          </span>
        </div>
      ))}
    </div>

    {/* Price breakdown */}
    <div className="space-y-2.5 mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-vy-grey">Subtotal</span>
        <span className="text-vy-white">₹{subtotal.toLocaleString()}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-green-400 flex items-center gap-1">
            <CheckCircle size={11} />
            Coupon {coupon?.code && `(${coupon.code})`}
          </span>
          <span className="text-green-400 font-medium">−₹{discount.toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-vy-grey">Shipping</span>
        <span className="text-green-400">Free</span>
      </div>
    </div>

    <div className="flex justify-between border-t border-vy-border pt-4">
      <span className="text-vy-white font-semibold text-sm">Total</span>
      <span className="text-vy-white font-bold text-xl">₹{total.toLocaleString()}</span>
    </div>
  </div>
);

// ─── Main Checkout Page ──────────────────────────────────────────
const Checkout = () => {
  const { items, coupon, discount, subtotal, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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
  const [errors, setErrors] = useState({});

  const onChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) newErrors.phone = '10-digit phone required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) newErrors.pincode = '6-digit pincode required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      toast.error('Please fix the errors below.', { className: 'toast-vybera' });
      return;
    }
    if (!user) {
      toast.error('Please sign in to continue.', { className: 'toast-vybera' });
      navigate('/login');
      return;
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

    setPaymentState('loading');
    setStep(3);

    try {
      const receipt = `vybera_${user.uid.slice(0, 8)}_${Date.now()}`;

      await openRazorpay({
        amount: total,          // Final amount IN RUPEES (after coupon discount)
        receipt,
        description: `VYBERA Order — ${items.length} item${items.length > 1 ? 's' : ''}`,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },

        onSuccess: async (response) => {
          try {
            // Save order to Firestore with all payment details
            await createOrder({
              userId: user.uid,
              userEmail: user.email,

              // Products
              products: items.map(i => ({
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                size: i.size,
                image: i.image || '',
              })),

              // Delivery
              address: {
                name: form.name,
                email: form.email,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
              },

              // Pricing
              subtotal,
              discount,
              total,
              couponCode: coupon?.code || null,

              // Razorpay
              paymentId: response.razorpay_payment_id,            // pay_xxxxx
              razorpayOrderId: response.razorpay_order_id || response.backendOrderId || null,   // order_xxxxx
              razorpaySignature: response.razorpay_signature || null,
              paymentReceipt: receipt,
            });

            // Clear cart + redirect
            clearCart();
            setPaymentState('success');
            setTimeout(() => navigate('/order-success'), 800);

          } catch (firestoreErr) {
            // Payment succeeded but DB write failed — still show success (don't double-charge)
            console.error('Firestore write failed after payment:', firestoreErr);
            clearCart();
            setPaymentState('success');
            toast.success('Payment successful! (Order logged manually, contact support if needed.)', { className: 'toast-vybera', duration: 6000 });
            setTimeout(() => navigate('/order-success'), 1000);
          }
        },

        onFailure: (error) => {
          console.error('Razorpay payment failed:', error);
          setPaymentState('failed');
          setStep(2); // Go back to review step
          const msg = error?.description || error?.reason || 'Payment was not completed.';
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
      <div className="min-h-screen bg-vy-black pt-24 flex flex-col items-center justify-center gap-6 px-6">
        <ShoppingBag size={48} className="text-vy-border" />
        <h2 className="font-display font-bold text-2xl tracking-wider text-vy-white">No items in cart</h2>
        <Link to="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vy-black pt-24">
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl tracking-wider text-vy-white mb-8 border-b border-vy-border pb-6">
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
                  <Loader2 size={48} className="text-vy-white animate-spin" />
                  <div>
                    <h2 className="text-vy-white font-semibold text-xl tracking-wider mb-2">
                      Processing Payment
                    </h2>
                    <p className="text-vy-grey text-sm">
                      Complete the payment in the Razorpay window…
                    </p>
                  </div>
                </>
              )}
              {paymentState === 'success' && (
                <>
                  <CheckCircle size={64} className="text-green-400" />
                  <div>
                    <h2 className="text-vy-white font-semibold text-xl tracking-wider mb-2">
                      Payment Successful!
                    </h2>
                    <p className="text-vy-grey text-sm">Redirecting you to order confirmation…</p>
                  </div>
                </>
              )}
              {paymentState === 'failed' && (
                <>
                  <AlertCircle size={48} className="text-red-400" />
                  <div>
                    <h2 className="text-vy-white font-semibold text-xl tracking-wider mb-2">
                      Payment Failed
                    </h2>
                    <p className="text-vy-grey text-sm mb-6">Going back to order review…</p>
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
                <h2 className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-6">
                  Delivery Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={errors.name ? 'relative' : ''}>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Full Name *</label>
                    <input name="name" value={form.name} onChange={onChange} className={`vy-input ${errors.name ? 'border-red-500/60' : ''}`} placeholder="Your full name" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={onChange} className={`vy-input ${errors.email ? 'border-red-500/60' : ''}`} placeholder="you@example.com" />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Phone *</label>
                    <input name="phone" value={form.phone} onChange={onChange} className={`vy-input ${errors.phone ? 'border-red-500/60' : ''}`} placeholder="10-digit mobile" maxLength={10} />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Pincode *</label>
                    <input name="pincode" value={form.pincode} onChange={onChange} className={`vy-input ${errors.pincode ? 'border-red-500/60' : ''}`} placeholder="6-digit pincode" maxLength={6} />
                    {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Street Address *</label>
                    <input name="address" value={form.address} onChange={onChange} className={`vy-input ${errors.address ? 'border-red-500/60' : ''}`} placeholder="House no., Street, Landmark" />
                    {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">City *</label>
                    <input name="city" value={form.city} onChange={onChange} className={`vy-input ${errors.city ? 'border-red-500/60' : ''}`} placeholder="Mumbai" />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">State *</label>
                    <input name="state" value={form.state} onChange={onChange} className={`vy-input ${errors.state ? 'border-red-500/60' : ''}`} placeholder="Maharashtra" />
                    {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                  </div>
                </div>

                {!user && (
                  <div className="mt-6 p-4 border border-yellow-500/30 bg-yellow-500/5">
                    <p className="text-yellow-400 text-xs">
                      You need to{' '}
                      <Link to="/login" className="underline font-semibold">sign in</Link>
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

              {/* Sidebar summary */}
              <div className="hidden lg:block h-fit lg:sticky lg:top-24">
                <OrderSummaryPanel
                  items={items}
                  coupon={coupon}
                  discount={discount}
                  subtotal={subtotal}
                  total={total}
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
                <div className="bg-vy-card border border-vy-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-vy-white text-xs font-semibold tracking-widest uppercase">
                      Delivering To
                    </h2>
                    <button
                      onClick={() => setStep(1)}
                      className="text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-vy-white text-sm font-medium">{form.name}</p>
                    <p className="text-vy-grey text-sm">{form.address}</p>
                    <p className="text-vy-grey text-sm">{form.city}, {form.state} — {form.pincode}</p>
                    <p className="text-vy-grey text-sm">{form.phone} · {form.email}</p>
                  </div>
                </div>

                {/* Order summary (mobile visible here) */}
                <div className="lg:hidden">
                  <OrderSummaryPanel
                    items={items}
                    coupon={coupon}
                    discount={discount}
                    subtotal={subtotal}
                    total={total}
                    compact
                  />
                </div>
              </div>

              {/* Right: Pay panel */}
              <div className="h-fit lg:sticky lg:top-24 space-y-4">
                {/* Summary */}
                <div className="hidden lg:block">
                  <OrderSummaryPanel
                    items={items}
                    coupon={coupon}
                    discount={discount}
                    subtotal={subtotal}
                    total={total}
                  />
                </div>

                {/* Razorpay Pay Button */}
                <div className="bg-vy-card border border-vy-border p-6">
                  {/* Coupon confirmation */}
                  {discount > 0 && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/10 border border-green-500/20">
                      <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-green-400 text-xs font-semibold">
                          Coupon {coupon?.code} applied
                        </p>
                        <p className="text-green-400/70 text-xs">
                          You save ₹{discount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Secure badge */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-px h-6 bg-vy-border" />
                    <div className="flex items-center gap-2">
                      <span className="text-vy-grey text-xs">Secured by</span>
                      <span className="text-vy-white text-xs font-bold tracking-widest">RAZORPAY</span>
                    </div>
                  </div>

                  {/* Final amount */}
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="text-vy-grey text-sm">You pay</span>
                    <div className="text-right">
                      <span className="text-vy-white font-bold text-2xl">₹{total.toLocaleString()}</span>
                      {discount > 0 && (
                        <p className="text-vy-grey text-xs line-through">
                          ₹{subtotal.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment}
                    className="btn-primary w-full flex items-center justify-center gap-3 text-sm py-4"
                  >
                    Pay ₹{total.toLocaleString()} with Razorpay
                  </motion.button>

                  <p className="text-vy-grey text-[10px] text-center mt-3 tracking-wide">
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
