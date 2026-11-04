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

    const urlError = searchParams.get('error');
    if (urlError) {
      setVerifyError(decodeURIComponent(urlError));
      return;
    }

    // Check if we arrived via Razorpay redirect with raw parameters
    const razorpayPaymentId = searchParams.get('razorpay_payment_id');
    const razorpayOrderId = searchParams.get('razorpay_order_id');
    const razorpaySignature = searchParams.get('razorpay_signature');
    const firebaseOrderId = searchParams.get('foid') || localStorage.getItem('vybera_pending_order');

    // Clean up pending order from localStorage
    localStorage.removeItem('vybera_pending_order');

    if (razorpayPaymentId && razorpayOrderId && razorpaySignature && firebaseOrderId) {
      // Direct query parameters present — verify with backend
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
          const data = await res.json().catch(() => ({}));
          if (!res.ok && !data.message?.includes('already')) {
            throw new Error(data.error || 'Payment verification failed');
          }
          setVerified(true);
        })
        .catch((err) => {
          console.error('Redirect payment verification failed:', err);
          if (err.message?.includes('already')) {
            setVerified(true);
          } else {
            setVerifyError(err.message);
          }
        })
        .finally(() => setVerifying(false));
    } else {
      // Normal popup payment or serverless callback redirect (/api/razorpay-callback)
      setVerified(true);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state while verifying redirect payment
  if (verifying) {
    return (
      <div className="min-h-screen bg-[#F3E7D8] flex flex-col items-center justify-center gap-6 px-6 text-center py-20">
        <Loader2 size={48} className="text-[#590907] animate-spin" />
        <h2 className="font-display font-bold text-2xl tracking-wider text-[#30231F]">
          Verifying Payment...
        </h2>
        <p className="text-[#75665C] text-sm max-w-sm font-medium">
          Please wait while we confirm your payment. Do not close this page.
        </p>
      </div>
    );
  }

  // Error state
  if (verifyError) {
    return (
      <div className="min-h-screen bg-[#F3E7D8] flex flex-col items-center justify-center gap-6 px-6 text-center py-20">
        <div className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center shadow-sm">
          <AlertCircle size={40} className="text-rose-700" />
        </div>
        <h2 className="font-display font-bold text-2xl tracking-wider text-[#30231F]">
          Verification Issue
        </h2>
        <p className="text-[#75665C] text-sm max-w-sm leading-relaxed font-medium">
          {verifyError}. If money was deducted, please don't worry — contact our support and we'll resolve it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
          <Link to="/dashboard/orders" className="btn-primary flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-wider">
            <ShoppingBag size={16} /> VIEW MY ORDERS
          </Link>
          <a
            href={`https://wa.me/917043568477?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="border border-[#D4BEA5] bg-white hover:bg-[#FAF5ED] text-[#30231F] flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
          >
            <MessageCircle size={16} className="text-emerald-700" /> WHATSAPP SUPPORT
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3E7D8] flex flex-col items-center justify-center gap-8 px-6 text-center py-20">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-emerald-50 border border-emerald-300 rounded-full flex items-center justify-center mb-2 shadow-sm"
      >
        <CheckCircle size={40} className="text-emerald-700" />
      </motion.div>

      <div className="space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display font-black text-4xl md:text-5xl tracking-wider text-[#30231F]"
        >
          ORDER CONFIRMED
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#75665C] text-sm max-w-sm mx-auto leading-relaxed font-medium"
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
          className="btn-primary flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-wider"
        >
          <ShoppingBag size={16} /> VIEW MY ORDERS
        </Link>
        <a 
          href={`https://wa.me/917043568477?text=${whatsappMsg}`}
          target="_blank"
          rel="noreferrer"
          className="border border-[#D4BEA5] bg-white hover:bg-[#FAF5ED] text-[#30231F] flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
        >
          <MessageCircle size={16} className="text-emerald-700" /> WHATSAPP SUPPORT
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pt-8 border-t border-[#D4BEA5] w-full max-w-md"
      >
        <Link to="/shop" className="text-[#75665C] hover:text-[#590907] text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 transition-all group">
          Back to Shop <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
