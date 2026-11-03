import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, Tag, ArrowRight, ShoppingBag, Ticket } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { validateCoupon, getAllCoupons } from '../firebase/coupons';
import { getProductPricing } from '../utils/pricing';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import BackButton from '../components/ui/BackButton';

const PLACEHOLDER = 'https://placehold.co/200x250/141414/888888?text=NX';

const Cart = () => {
  const { items, removeItem, updateQuantity, coupon, discount, applyCoupon, removeCoupon, subtotal, total, itemCount, campaign } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [myCampaignCoupons, setMyCampaignCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllCoupons().then(coupons => {
      setAvailableCoupons(coupons.filter(c => c.active && c.showToUser));
    });
  }, []);

  useEffect(() => {
    const fetchCampaignCoupons = async () => {
      if (user) {
        const couponsQuery = query(collection(db, 'coupons'), where('uid', '==', user.uid));
        const snap = await getDocs(couponsQuery);
        const campaignCoupons = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => c.campaignId && c.active && !c.used && (!c.expiry || new Date(c.expiry) > new Date()));
        setMyCampaignCoupons(campaignCoupons);
      }
    };
    fetchCampaignCoupons();
  }, [user]);

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
      <div className="min-h-screen bg-[#F3E7D8] pt-24 flex flex-col items-center justify-center gap-6 px-6 relative">
        <BackButton className="absolute top-24 left-6 md:left-12" />
        <ShoppingBag size={48} className="text-[#D4BEA5]" />
        <h2 className="font-display font-bold text-2xl tracking-wider text-[#30231F]">Your cart is empty</h2>
        <p className="text-[#75665C] text-sm tracking-wide font-medium">Add products to get started.</p>
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
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-2 border-b border-[#D4BEA5] pb-6"
        >
          Cart ({itemCount})
        </motion.h1>

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
                  className="flex gap-5 py-6 border-b border-[#D4BEA5]"
                >
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {item.isCustom ? (
                      <img
                        src={item.image || PLACEHOLDER}
                        alt="Custom Design"
                        className="w-20 h-24 object-contain bg-white border border-[#D4BEA5] p-1"
                      />
                    ) : (
                      <Link to={`/product/${item.id}`}>
                        <img
                          src={item.image || PLACEHOLDER}
                          alt={item.name}
                          className="w-20 h-24 object-cover bg-white border border-[#D4BEA5]"
                        />
                      </Link>
                    )}
                  </div>
 
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[#30231F] text-sm font-bold tracking-wide">
                          {item.isCustom ? <span className="text-[#590907] uppercase text-[10px] block mb-1 font-semibold">Custom Order</span> : null}
                          {item.name}
                        </h3>
                        <p className="text-[#75665C] text-xs mt-1">
                          Size: {item.size}
                          {item.selectedColor && ` | Color: ${item.selectedColor}`}
                          {item.isCustom && item.position && ` | Pos: ${item.position}`}
                        </p>
                        {item.isCustom && (
                          <p className="text-[#75665C]/80 text-[11px] mt-1 italic line-clamp-1">{item.description}</p>
                        )}
                        <p className="text-[#590907] text-base font-bold mt-2 font-mono">
                          ₹{(getProductPricing(item, campaign).price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.size, item.selectedColor, item.cartId)}
                        className="text-[#75665C] hover:text-rose-700 transition-colors p-1 flex-shrink-0"
                        title="Remove Item"
                      >
                        <X size={16} />
                      </button>
                    </div>
 
                    {/* Qty Controls */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.selectedColor, item.quantity - 1, item.cartId)}
                        className="w-8 h-8 border border-[#D4BEA5] bg-white flex items-center justify-center text-[#30231F] hover:border-[#590907] hover:bg-[#FAF5ED] transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-[#30231F] text-sm w-8 text-center font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.selectedColor, item.quantity + 1, item.cartId)}
                        className="w-8 h-8 border border-[#D4BEA5] bg-white flex items-center justify-center text-[#30231F] hover:border-[#590907] hover:bg-[#FAF5ED] transition-colors"
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
            <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
              <h2 className="text-[#30231F] font-bold tracking-widest uppercase text-sm mb-6">
                Order Summary
              </h2>

              {/* Coupon */}
              <div className="mb-6">
                {coupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-emerald-700" />
                      <span className="text-emerald-800 text-xs font-mono font-bold">{coupon.code}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-800 hover:text-rose-700 transition-colors"
                    >
                      <X size={14} />
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
                      className="px-4 py-3 bg-[#590907] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#430605] transition-colors disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Your Campaign Rewards */}
              {!coupon && myCampaignCoupons.length > 0 && (
                <div className="mb-6 border-b border-[#D4BEA5] pb-6">
                  <h3 className="text-[#590907] text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                    <Ticket size={14} /> Your Rewards
                  </h3>
                  <div className="space-y-3">
                    {myCampaignCoupons.map(c => (
                      <div key={c.id} className="border border-[#D4BEA5] bg-white p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold text-[#590907] tracking-widest">{c.code}</span>
                          <button
                            onClick={() => handleApplyCoupon(c.code)}
                            disabled={couponLoading}
                            className="text-[#590907] text-xs font-bold uppercase tracking-widest hover:underline transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        <p className="text-[#75665C] text-xs font-medium">
                          {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`} • Campaign: {c.campaignId}
                        </p>
                        {c.expiry && (
                          <p className="text-[#75665C] text-[10px]">
                            Expires: {new Date(c.expiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Coupons */}
              {!coupon && availableCoupons.length > 0 && (
                <div className="mb-6 border-b border-[#D4BEA5] pb-6">
                  <h3 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4">Available Coupons</h3>
                  <div className="space-y-3">
                    {availableCoupons.map(c => {
                      const isValid = subtotal >= (c.minOrder || 0);
                      return (
                        <div key={c.id} className="border border-[#D4BEA5] p-3 bg-white flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-[#590907] tracking-widest">{c.code}</span>
                            {isValid ? (
                              <button
                                onClick={() => handleApplyCoupon(c.code)}
                                disabled={couponLoading}
                                className="text-[#590907] text-xs font-bold uppercase tracking-widest hover:underline transition-colors"
                              >
                                Apply
                              </button>
                            ) : (
                              <span className="text-[#75665C] text-[10px] uppercase tracking-widest font-semibold">
                                Add ₹{(c.minOrder - subtotal).toLocaleString()} more
                              </span>
                            )}
                          </div>
                          <p className="text-[#75665C] text-xs font-medium">
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
              <div className="space-y-3 mb-6 pb-6 border-b border-[#D4BEA5]">
                <div className="flex justify-between">
                  <span className="text-[#75665C] text-sm">Subtotal</span>
                  <span className="text-[#30231F] font-bold text-sm font-mono">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 text-sm font-semibold">Coupon Discount</span>
                    <span className="text-emerald-700 text-sm font-bold font-mono">−₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#75665C] text-sm">Shipping</span>
                  <span className="text-emerald-700 font-bold text-sm">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-8">
                <span className="text-[#30231F] font-bold text-base uppercase tracking-wider">Total</span>
                <span className="text-[#590907] font-bold text-2xl font-mono">₹{total.toLocaleString()}</span>
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
