import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { validateCoupon, getAllCoupons } from '../firebase/coupons';
import toast from 'react-hot-toast';
import BackButton from '../components/ui/BackButton';

const PLACEHOLDER = 'https://placehold.co/200x250/141414/888888?text=NX';

const Cart = () => {
  const { items, removeItem, updateQuantity, coupon, discount, applyCoupon, removeCoupon, subtotal, total, itemCount } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllCoupons().then(coupons => {
      setAvailableCoupons(coupons.filter(c => c.active && c.showToUser));
    });
  }, []);

  const handleApplyCoupon = async (codeToApply = couponCode) => {
    const code = codeToApply.trim();
    if (!code) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(code, subtotal, user?.uid);
      if (result.valid) {
        applyCoupon(result.coupon);
        setCouponCode('');
        toast.success(result.message, { className: 'toast-vybera' });
      } else {
        toast.error(result.message, { className: 'toast-vybera' });
      }
    } catch (e) {
      toast.error('Error validating coupon.', { className: 'toast-vybera' });
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex flex-col items-center justify-center gap-6 px-6 relative">
        <BackButton className="absolute top-24 left-6 md:left-12" />
        <ShoppingBag size={48} className="text-vy-border" />
        <h2 className="font-display font-bold text-2xl tracking-wider text-vy-white">Your cart is empty</h2>
        <p className="text-vy-grey text-sm tracking-wide">Add products to get started.</p>
        <Link to="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vy-black pt-24">
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-bold text-3xl tracking-wider text-vy-white mb-2 border-b border-vy-border pb-6"
        >
          Cart ({itemCount})
        </motion.h1>

        {/* Anniversary Alert */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 p-4 bg-vy-accent/10 border border-vy-accent/30 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-vy-accent flex items-center justify-center text-vy-black shrink-0">
             <Tag size={20} />
          </div>
          <div>
            <h3 className="text-vy-white text-xs font-bold tracking-widest uppercase">1st Anniversary Sale is LIVE!</h3>
            <p className="text-vy-grey text-[10px] mt-1">Buy 1 Get 1 Free — Apply your coupon in the summary below.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-0">
            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={`${item.id}-${item.size}-${item.selectedColor}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-5 py-6 border-b border-vy-border"
                >
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {item.isCustom ? (
                      <img
                        src={item.image || PLACEHOLDER}
                        alt="Custom Design"
                        className="w-20 h-24 object-contain bg-vy-card p-1"
                      />
                    ) : (
                      <Link to={`/product/${item.id}`}>
                        <img
                          src={item.image || PLACEHOLDER}
                          alt={item.name}
                          className="w-20 h-24 object-cover bg-vy-card"
                        />
                      </Link>
                    )}
                  </div>
 
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-vy-white text-sm font-medium tracking-wide">
                          {item.isCustom ? <span className="text-vy-accent uppercase text-[10px] block mb-1">Custom Order</span> : null}
                          {item.name}
                        </h3>
                        <p className="text-vy-grey text-xs mt-1">
                          Size: {item.size}
                          {item.selectedColor && ` | Color: ${item.selectedColor}`}
                          {item.isCustom && item.position && ` | Pos: ${item.position}`}
                        </p>
                        {item.isCustom && (
                          <p className="text-vy-grey/60 text-[10px] mt-1 italic line-clamp-1">{item.description}</p>
                        )}
                        <p className="text-vy-white text-sm font-semibold mt-2">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.size, item.selectedColor, item.cartId)}
                        className="text-vy-grey hover:text-vy-white transition-colors p-1 flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
 
                    {/* Qty Controls */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.selectedColor, item.quantity - 1, item.cartId)}
                        className="w-8 h-8 border border-vy-border flex items-center justify-center text-vy-grey hover:text-vy-white hover:border-vy-grey transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-vy-white text-sm w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.selectedColor, item.quantity + 1, item.cartId)}
                        className="w-8 h-8 border border-vy-border flex items-center justify-center text-vy-grey hover:text-vy-white hover:border-vy-grey transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-24 h-fit"
          >
            <div className="bg-vy-card border border-vy-border p-6">
              <h2 className="text-vy-white font-semibold tracking-widest uppercase text-sm mb-6">
                Order Summary
              </h2>

              {/* Coupon */}
              <div className="mb-6">
                {coupon ? (
                  <div className="flex items-center justify-between bg-vy-border/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-green-400" />
                      <span className="text-green-400 text-xs font-mono font-bold">{coupon.code}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-vy-grey hover:text-vy-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      className="vy-input flex-1 text-xs"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading}
                      className="px-4 py-3 bg-vy-white text-vy-black text-xs font-semibold tracking-widest uppercase hover:bg-vy-accent transition-colors disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Available Coupons */}
              {!coupon && availableCoupons.length > 0 && (
                <div className="mb-6 border-b border-vy-border pb-6">
                  <h3 className="text-vy-grey text-xs tracking-widest uppercase mb-4">Available Coupons</h3>
                  <div className="space-y-3">
                    {availableCoupons.map(c => {
                      const isValid = subtotal >= (c.minOrder || 0);
                      return (
                        <div key={c.id} className="border border-vy-border p-3 bg-vy-black/50 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-vy-white tracking-widest">{c.code}</span>
                            {isValid ? (
                              <button
                                onClick={() => handleApplyCoupon(c.code)}
                                disabled={couponLoading}
                                className="text-vy-accent text-xs font-semibold uppercase tracking-widest hover:text-vy-white transition-colors"
                              >
                                Apply
                              </button>
                            ) : (
                              <span className="text-vy-grey text-[10px] uppercase tracking-widest">
                                Add ₹{(c.minOrder - subtotal).toLocaleString()} more
                              </span>
                            )}
                          </div>
                          <p className="text-vy-grey text-xs">
                            Get {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`} off
                            {c.minOrder ? ` on orders above ₹${c.minOrder}` : ''}.
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-vy-border">
                <div className="flex justify-between">
                  <span className="text-vy-grey text-sm">Subtotal</span>
                  <span className="text-vy-white text-sm">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-400 text-sm">Coupon Discount</span>
                    <span className="text-green-400 text-sm">−₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-vy-grey text-sm">Shipping</span>
                  <span className="text-green-400 text-sm">Free</span>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <span className="text-vy-white font-semibold">Total</span>
                <span className="text-vy-white font-bold text-xl">₹{total.toLocaleString()}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
