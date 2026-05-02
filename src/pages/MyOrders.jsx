import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Paintbrush } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdersByUser } from '../firebase/orders';
import { getCustomOrdersByUser } from '../firebase/customOrders';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' | 'custom'

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [o, co] = await Promise.all([
          getOrdersByUser(user.uid),
          getCustomOrdersByUser(user.uid)
        ]);
        setOrders(o);
        setCustomOrders(co);
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
      case 'cancelled':
      case 'rejected': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'shipped': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'out_for_delivery':
      case 'delivered':
      case 'approved': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'processing': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-vy-white border-vy-white/30 bg-vy-white/10'; // confirmed
    }
  };

  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="font-display font-bold text-3xl tracking-wider text-vy-white mb-6">
            My Orders
          </h1>
          <div className="flex gap-4 border-b border-vy-border pb-4">
            <button
              onClick={() => setActiveTab('regular')}
              className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                activeTab === 'regular' ? 'bg-vy-white text-vy-black border-vy-white' : 'bg-transparent text-vy-grey border-vy-border hover:border-vy-grey'
              }`}
            >
              <ShoppingBag size={14} /> Regular Shop
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                activeTab === 'custom' ? 'bg-vy-white text-vy-black border-vy-white' : 'bg-transparent text-vy-grey border-vy-border hover:border-vy-grey'
              }`}
            >
              <Paintbrush size={14} /> Custom Orders
            </button>
          </div>
        </motion.div>

        {activeTab === 'regular' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center p-12 bg-vy-card border border-vy-border">
                <p className="text-vy-grey tracking-widest text-sm uppercase">You haven't placed any orders yet.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-vy-card border border-vy-border p-6 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-vy-white font-semibold flex flex-wrap gap-2 items-center">
                      Order ID: <span className="font-mono text-xs">{order.id}</span>
                    </p>
                    <p className="text-vy-grey text-xs">Placed on: {order.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}</p>
                    <p className="text-vy-grey text-xs leading-relaxed max-w-lg">Items: {order.products?.map(p => `${p.name} (x${p.quantity})`).join(', ')}</p>
                    <p className="text-vy-white font-medium mt-2 block tracking-wider">Total: ₹{order.total?.toLocaleString()}</p>
                  </div>
                  <div className="md:text-right flex flex-col items-end gap-3">
                    <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {order.status?.replace(/_/g, ' ') || 'Confirmed'}
                    </span>
                    <Link to={`/track-order/${order.id}`} className="btn-outline px-4 py-2 text-[10px]">
                      Track Order
                    </Link>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {customOrders.length === 0 ? (
              <div className="text-center p-12 bg-vy-card border border-vy-border">
                <p className="text-vy-grey tracking-widest text-sm uppercase">You haven't requested any custom designs.</p>
              </div>
            ) : (
              customOrders.map(order => (
                <div key={order.id} className="bg-vy-card border border-vy-border p-6 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex gap-2">
                      {order.imageUrls?.map((url, i) => (
                        <div key={i} className="w-16 h-20 bg-vy-dark border border-vy-border flex-shrink-0">
                          <img src={url} alt="Custom Design" className="w-full h-full object-cover p-1 opacity-75" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="text-vy-white font-semibold">Custom Design Order</p>
                      <p className="text-vy-grey text-xs mb-1">Date: {order.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}</p>
                      <p className="text-vy-grey text-[10px] uppercase tracking-widest">Size: {order.size} | Color: {order.color} | Pos: {order.position}</p>
                      <p className="text-vy-white font-medium mt-3 tracking-wider">Total: ₹{order.total?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="md:text-right flex flex-col items-end gap-3">
                    <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {order.status?.replace(/_/g, ' ') || 'Confirmed'}
                    </span>
                    <Link to={`/track-order/${order.id}`} className="btn-outline px-4 py-2 text-[10px]">
                      Track Order
                    </Link>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
