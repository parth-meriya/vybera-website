import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Copy, CheckCircle, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../firebase/users';
import { getAllCoupons } from '../../firebase/coupons';
import toast from 'react-hot-toast';

const Coupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [prof, allCoupons] = await Promise.all([
          getUserProfile(user.uid),
          getAllCoupons()
        ]);
        
        setPoints(prof?.points || 0);
        
        const now = new Date();
        const activeCoupons = allCoupons.filter(c => 
          c.active && (!c.expiry || new Date(c.expiry) >= now)
        );
        setCoupons(activeCoupons);
      } catch (err) {
        console.error('Failed to fetch coupons/rewards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied!', { className: 'toast-vybera' });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2">Coupons & Rewards</h2>
        <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Your exclusive offers and loyalty points</p>
      </div>

      {/* Loyalty Points Section */}
      <div className="bg-vy-accent/5 border border-vy-accent p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 right-10 text-vy-accent/10 pointer-events-none">
          <Award size={160} />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-vy-accent text-[10px] tracking-widest uppercase font-bold mb-2">VYBERA Rewards</h3>
          <p className="text-vy-white text-lg">You currently have</p>
          <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
            <span className="font-display font-bold text-5xl text-vy-white">{points}</span>
            <span className="text-vy-grey text-sm tracking-widest uppercase">Points</span>
          </div>
          <p className="text-vy-grey text-xs mt-3">1 Point = ₹1 Discount on your next order.</p>
        </div>
        <div className="relative z-10 w-full md:w-auto text-center">
          <p className="text-vy-grey text-[10px] uppercase tracking-widest mb-3">Redeem at checkout</p>
          <button 
            className="w-full md:w-auto px-8 py-3 bg-vy-accent text-vy-black text-xs font-bold uppercase tracking-widest hover:bg-vy-white transition-colors"
            onClick={() => window.location.href = '/shop'}
          >
            Shop Now
          </button>
        </div>
      </div>

      <h3 className="text-vy-white text-sm tracking-widest uppercase font-bold pt-4 border-b border-vy-border pb-4">
        Active Coupons
      </h3>

      {coupons.length === 0 ? (
        <div className="bg-vy-card border border-vy-border p-12 text-center flex flex-col items-center">
          <Ticket size={48} className="text-vy-border mb-4" />
          <p className="text-vy-white text-lg font-bold mb-2">No active coupons</p>
          <p className="text-vy-grey text-xs">Check back later for exclusive drops and offers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="bg-vy-card border border-vy-border flex flex-col">
              <div className="p-6 border-b border-vy-border border-dashed flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-vy-white text-vy-black px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                  </div>
                  {coupon.expiry && (
                    <span className="text-vy-grey text-[10px] tracking-widest uppercase">
                      Valid till {new Date(coupon.expiry).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <h4 className="text-vy-white font-bold text-lg mb-2 tracking-wide">{coupon.description || 'Exclusive VYBERA Discount'}</h4>
                
                <ul className="space-y-1 mt-4">
                  {coupon.minOrder && (
                    <li className="text-vy-grey text-xs flex items-center gap-2">
                      <span className="w-1 h-1 bg-vy-grey rounded-full" /> 
                      Minimum order value: ₹{coupon.minOrder.toLocaleString()}
                    </li>
                  )}
                  {coupon.type === 'percentage' && coupon.maxDiscount && (
                    <li className="text-vy-grey text-xs flex items-center gap-2">
                      <span className="w-1 h-1 bg-vy-grey rounded-full" /> 
                      Maximum discount: ₹{coupon.maxDiscount.toLocaleString()}
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="p-4 bg-vy-black/40 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-vy-grey tracking-widest uppercase mb-1">Coupon Code</span>
                  <span className="font-mono text-vy-white font-bold tracking-widest text-lg">{coupon.code}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(coupon.code)}
                  className="w-10 h-10 border border-vy-border flex items-center justify-center text-vy-grey hover:text-vy-white hover:border-vy-white transition-all bg-vy-card"
                  title="Copy code"
                >
                  {copiedCode === coupon.code ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Coupons;
