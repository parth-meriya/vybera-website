import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const OrderSuccess = () => (
  <div className="min-h-screen bg-vy-black flex flex-col items-center justify-center gap-6 px-6 text-center">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <CheckCircle size={64} className="text-green-400 mb-2" />
    </motion.div>
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="font-display font-bold text-3xl tracking-wider text-vy-white"
    >
      Order Confirmed
    </motion.h1>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="text-vy-grey text-sm max-w-sm"
    >
      Your order has been placed successfully. You'll receive a confirmation soon. Welcome to the next era.
    </motion.p>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex gap-4 mt-4"
    >
      <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      <Link to="/" className="btn-outline">Back Home</Link>
    </motion.div>
  </div>
);

export default OrderSuccess;
