import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, MessageCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const OrderSuccess = () => {
  const whatsappMsg = encodeURIComponent("Hi VYBERA, I just placed an order and need some help.");
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Always clear cart when reaching this page
    clearCart();

    // Check if we arrived via Razorpay redirect (UPI payments)
    const razorpayPaymentId = searchParams.get('razorpay_payment_id');
    const razorpayOrderId = searchParams.get('razorpay_order_id');
    const razorpaySignature = searchParams.get('razorpay_signature');
    const firebaseOrderId = searchParams.get('foid') || localStorage.getItem('vybera_pending_order');

    // Clean up localStorage
    localStorage.removeItem('vybera_pending_order');

    if (razorpayPaymentId && razorpayOrderId && razorpaySignature && firebaseOrderId) {
      // This is a UPI redirect — verify payment on server
      setVerifying(true);
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          firebase_order_id: firebaseOrderId,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Payment verification failed');
          }
          setVerified(true);
        })
        .catch((err) => {
          console.error('Redirect payment verification failed:', err);
          // Don't show error if already confirmed (double-verify scenario)
          if (err.message?.includes('already')) {
            setVerified(true);
          } else {
            setVerifyError(err.message);
          }
        })
        .finally(() => setVerifying(false));
    } else {
      // Normal flow (popup payment) — already verified in Checkout.jsx
      setVerified(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state while verifying redirect payment
  if (verifying) {
    return (
      <div className="min-h-screen bg-vy-black flex flex-col items-center justify-center gap-6 px-6 text-center py-20">
        <Loader2 size={48} className="text-vy-accent animate-spin" />
        <h2 className="font-display font-bold text-2xl tracking-wider text-vy-white">
          Verifying Payment...
        </h2>
        <p className="text-vy-grey text-sm max-w-sm">
          Please wait while we confirm your payment. Do not close this page.
        </p>
      </div>
    );
  }

  // Error state
  if (verifyError) {
    return (
      <div className="min-h-screen bg-vy-black flex flex-col items-center justify-center gap-6 px-6 text-center py-20">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
          <AlertCircle size={40} className="text-red-400" />
        </div>
        <h2 className="font-display font-bold text-2xl tracking-wider text-vy-white">
          Verification Issue
        </h2>
        <p className="text-vy-grey text-sm max-w-sm leading-relaxed">
          {verifyError}. If money was deducted, please don't worry — contact our support and we'll resolve it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
          <Link to="/dashboard/orders" className="btn-primary flex items-center justify-center gap-3 py-4 text-xs font-bold">
            <ShoppingBag size={16} /> VIEW MY ORDERS
          </Link>
          <a
            href={`https://wa.me/917043568477?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline flex items-center justify-center gap-3 py-4 text-xs font-bold border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            <MessageCircle size={16} /> WHATSAPP SUPPORT
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vy-black flex flex-col items-center justify-center gap-8 px-6 text-center py-20">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-2"
      >
        <CheckCircle size={40} className="text-green-400" />
      </motion.div>

      <div className="space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display font-bold text-4xl md:text-5xl tracking-wider text-vy-white"
        >
          ORDER CONFIRMED
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-vy-grey text-sm max-w-sm mx-auto leading-relaxed"
        >
          Your payment was successful and your order is being processed. 
          You can track your status in your account.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md"
      >
        <Link 
          to="/dashboard/orders" 
          className="btn-primary flex items-center justify-center gap-3 py-4 text-xs font-bold"
        >
          <ShoppingBag size={16} /> VIEW MY ORDERS
        </Link>
        <a 
          href={`https://wa.me/917043568477?text=${whatsappMsg}`}
          target="_blank"
          rel="noreferrer"
          className="btn-outline flex items-center justify-center gap-3 py-4 text-xs font-bold border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <MessageCircle size={16} /> WHATSAPP SUPPORT
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pt-8 border-t border-vy-border w-full max-w-md"
      >
        <Link to="/shop" className="text-vy-grey hover:text-vy-white text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 transition-all group">
          Back to Shop <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
