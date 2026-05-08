import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdersByUser } from '../firebase/orders';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const o = await getOrdersByUser(user.uid);
        setOrders(o);
      } catch (err) {
        toast.error('Failed to load orders.', { className: 'toast-vybera' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex flex-col items-center justify-center">
        <div className="spinner mb-6" />
        <p className="text-vy-grey text-xs tracking-widest uppercase">Fetching Orders...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'cancelled': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'shipped': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'out_for_delivery':
      case 'delivered': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'processing': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-vy-white border-vy-white/30 bg-vy-white/10'; // confirmed/pending
    }
  };

  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <div className="max-w-screen-lg mx-auto px-6 md:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center md:text-left">
          <h1 className="font-display font-bold text-4xl tracking-wider text-vy-white mb-2">
            My Orders
          </h1>
          <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Track your journey with VYBERA</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-24 bg-vy-card border border-vy-border border-dashed">
              <ShoppingBag size={48} className="text-vy-border mx-auto mb-4 opacity-50" />
              <p className="text-vy-grey tracking-widest text-sm uppercase">You haven't placed any orders yet.</p>
              <Link to="/shop" className="btn-primary mt-6 inline-block">Start Shopping</Link>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-vy-card border border-vy-border hover:border-vy-grey transition-all group overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] text-vy-border uppercase tracking-widest bg-vy-border/10 px-2 py-1 rounded">#{order.id.slice(0, 12)}</span>
                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, ' ') || 'Confirmed'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {order.products?.map((p, i) => (
                          <div key={i} className="flex gap-4 items-center">
                            <div className="relative w-12 h-16 bg-vy-dark border border-vy-border overflow-hidden shrink-0">
                              <img src={p.image || 'https://placehold.co/60x80/141414/888888?text=VY'} alt={p.name} className="w-full h-full object-cover" />
                              {p.isCustom && <div className="absolute top-0 right-0 bg-vy-accent text-vy-black text-[7px] font-bold px-1 py-0.5">CUSTOM</div>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-vy-white text-xs font-medium truncate">{p.name}</p>
                              <p className="text-vy-grey text-[10px] uppercase tracking-wider">
                                {p.size} × {p.quantity} {p.fit ? `| ${p.fit}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 pt-2 border-t border-vy-border/30">
                         <div>
                            <p className="text-vy-grey text-[9px] uppercase tracking-widest mb-1">Ordered On</p>
                            <p className="text-vy-white text-xs">{order.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || 'Recently'}</p>
                         </div>
                         <div>
                            <p className="text-vy-grey text-[9px] uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-vy-white text-xs font-bold">₹{order.total?.toLocaleString()}</p>
                         </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto self-stretch flex items-end">
                      <Link 
                        to={`/track-order/${order.id}`} 
                        className="w-full md:w-auto bg-vy-white text-vy-black px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-vy-accent transition-all flex items-center justify-center gap-2 group"
                      >
                        Track Order <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyOrders;
