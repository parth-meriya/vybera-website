import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByUser } from '../../firebase/orders';
import toast from 'react-hot-toast';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'cancelled': 
      case 'refunded': return 'badge-cancelled';
      case 'shipped': return 'badge-shipped';
      case 'out_for_delivery': return 'badge-pending';
      case 'delivered': return 'badge-delivered';
      case 'processing': return 'badge-processing';
      default: return 'badge-confirmed'; // confirmed/pending
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2 text-[#30231F]">My Orders</h2>
        <p className="text-[#75665C] text-xs tracking-[0.2em] uppercase font-semibold">Track your journey with VYBERA</p>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-[#FAF5ED] border border-[#D4BEA5] border-dashed shadow-sm">
            <ShoppingBag size={48} className="text-[#D4BEA5] mx-auto mb-4 opacity-75" />
            <p className="text-[#75665C] tracking-widest text-sm uppercase font-semibold">You haven't placed any orders yet.</p>
            <Link to="/shop" className="btn-primary mt-6 inline-block">Start Shopping</Link>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-[#FAF5ED] border border-[#D4BEA5] hover:border-[#590907] transition-all group overflow-hidden shadow-sm">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs text-[#590907] font-bold uppercase tracking-widest bg-white px-2.5 py-1 rounded border border-[#D4BEA5]">#{order.id.slice(0, 12)}</span>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${getStatusColor(order.status)}`}>
                        {order.status?.replace(/_/g, ' ') || 'Confirmed'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {order.products?.map((p, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          <div className="relative w-12 h-16 bg-white border border-[#D4BEA5] overflow-hidden shrink-0">
                            <img src={p.image || 'https://placehold.co/60x80/141414/888888?text=VY'} alt={p.name} className="w-full h-full object-cover" />
                            {p.isCustom && <div className="absolute top-0 right-0 bg-[#590907] text-white text-[7px] font-bold px-1 py-0.5">CUSTOM</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#30231F] text-xs font-bold truncate">{p.name}</p>
                            <p className="text-[#75665C] text-[10px] uppercase tracking-wider font-medium">
                              {p.size} × {p.quantity} {p.fit ? `| ${p.fit}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#D4BEA5]">
                        <div>
                          <p className="text-[#75665C] text-[9px] uppercase tracking-widest mb-1 font-semibold">Ordered On</p>
                          <p className="text-[#30231F] text-xs font-medium">{order.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || 'Recently'}</p>
                        </div>
                        <div>
                          <p className="text-[#75665C] text-[9px] uppercase tracking-widest mb-1 font-semibold">Total Amount</p>
                          <p className="text-[#590907] text-sm font-bold font-mono">₹{order.total?.toLocaleString()}</p>
                        </div>
                        {order.pointsEarned > 0 && (
                          <div>
                            <p className="text-[#75665C] text-[9px] uppercase tracking-widest mb-1 font-semibold">Points Earned</p>
                            <p className="text-emerald-700 text-xs font-bold font-mono">+{order.pointsEarned}</p>
                          </div>
                        )}
                        {order.pointsRedeemed > 0 && (
                          <div>
                            <p className="text-[#75665C] text-[9px] uppercase tracking-widest mb-1 font-semibold">Points Used</p>
                            <p className="text-[#590907] text-xs font-bold font-mono">-{order.pointsRedeemed}</p>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto self-stretch flex items-end">
                    <Link 
                      to={`/track-order/${order.id}`} 
                      className="btn-primary w-full md:w-auto text-[10px] !py-3 !px-5 flex items-center justify-center gap-2 group"
                    >
                      Track Order <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default Orders;
