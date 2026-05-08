import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Plus, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../firebase/products';
import { getAllOrders, updateOrderStatus } from '../../firebase/orders';
import { getAllUsers } from '../../firebase/users';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-vy-card border border-vy-border p-6"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2 rounded-none ${color}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">{label}</p>
    <p className="text-vy-white font-bold text-3xl font-display">{value}</p>
    {sub && <p className="text-vy-grey text-xs mt-1">{sub}</p>}
  </motion.div>
);

const STATUS_OPTIONS = ['pending', 'shipped', 'delivered', 'cancelled'];

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getAllOrders(), getAllUsers()]).then(
      ([p, o, u]) => {
        setProducts(p);
        setOrders(o);
        setUsers(u);
        setLoading(false);
      }
    );
  }, []);

  const revenue = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const bestSellers = Object.values(
    orders
      .filter(o => o.status !== 'cancelled')
      .flatMap(o => o.products || [])
      .reduce((acc, p) => {
        if (!acc[p.id]) acc[p.id] = { name: p.name, qty: 0, image: p.image };
        acc[p.id].qty += p.quantity;
        return acc;
      }, {})
  ).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const [copiedId, setCopiedId] = useState(null);
  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const statusClass = {
    pending: 'badge-pending',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Dashboard</h1>
        </div>
        <Link to="/admin/products" className="btn-primary flex items-center gap-2 text-xs">
          <Plus size={13} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Products" value={products.length} color="text-blue-400" />
        <StatCard icon={ShoppingCart} label="Orders" value={orders.length} sub={`${orders.filter(o=>(o.status?.toLowerCase() || 'pending') === 'pending').length} pending`} color="text-yellow-400" />
        <StatCard icon={Users} label="Users" value={users.length} color="text-green-400" />
        <StatCard icon={DollarSign} label="Revenue" value={`₹${revenue.toLocaleString()}`} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-vy-card border border-vy-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-vy-white font-semibold text-sm tracking-wider">Recent Orders</h2>
            <Link to="/admin/orders" className="text-vy-grey text-xs hover:text-vy-white transition-colors tracking-widest uppercase">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-vy-border">
                  {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-vy-grey text-left text-xs tracking-widest uppercase pb-3 font-normal pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map(order => (
                  <tr key={order.id} className="border-b border-vy-border/50 group">
                    <td className="py-3 pr-4 text-vy-grey text-xs font-mono flex items-center gap-2">
                      {order.id.slice(0, 8)}...
                      <button onClick={() => copyToClipboard(order.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-vy-border hover:text-vy-white">
                        {copiedId === order.id ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-vy-white text-xs">{order.address?.name || order.userEmail}</td>
                    <td className="py-3 pr-4 text-vy-white text-xs font-semibold">₹{order.total?.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={order.status?.toLowerCase() || 'pending'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`text-[10px] uppercase font-bold tracking-widest bg-transparent border-0 outline-none cursor-pointer ${statusClass[order.status?.toLowerCase() || 'pending']}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-vy-dark text-vy-white uppercase">{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 text-vy-grey text-xs">
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers Side Panel */}
        <div className="bg-vy-card border border-vy-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-vy-accent" />
            <h2 className="text-vy-white font-semibold tracking-widest uppercase text-sm">Best Sellers</h2>
          </div>
          
          <div className="space-y-6">
            {bestSellers.length === 0 ? (
              <p className="text-vy-grey text-xs">No data yet.</p>
            ) : (
              bestSellers.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="relative w-10 h-12 bg-vy-dark border border-vy-border overflow-hidden shrink-0">
                    <img src={item.image || 'https://placehold.co/40x50/141414/888888?text=VY'} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-vy-white text-[10px] font-medium truncate uppercase tracking-wider">{item.name}</p>
                    <p className="text-vy-grey text-[9px] uppercase tracking-[0.2em]">{item.qty} Sales</p>
                  </div>
                  <div className={`w-1 h-8 ${i === 0 ? 'bg-vy-accent' : 'bg-vy-border'} transition-all`} />
                </div>
              ))
            )}
          </div>

          <div className="mt-10 p-4 border border-vy-border bg-vy-black/20">
            <p className="text-vy-grey text-[9px] uppercase tracking-[0.2em] mb-2 font-bold">Quick Insights</p>
            <p className="text-vy-white text-[11px] leading-relaxed">
              Your average order value is <span className="text-vy-accent font-bold">₹{Math.round(revenue / (orders.filter(o=>o.status!=='cancelled').length || 1)).toLocaleString()}</span>. 
              {bestSellers[0] && ` ${bestSellers[0].name} is currently your most popular drop.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
