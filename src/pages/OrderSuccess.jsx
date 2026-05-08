import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';

const OrderSuccess = () => {
  const whatsappMsg = encodeURIComponent("Hi VYBERA, I just placed an order and need some help.");
  
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
          to="/my-orders" 
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
