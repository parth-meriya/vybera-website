import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Plus, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../firebase/products';
import { isProductSaleActive, isProductNewDropActive } from '../../utils/pricing';
import { getAllOrders, updateOrderStatus } from '../../firebase/orders';
import { getAllUsers } from '../../firebase/users';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color, isCurrency }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-sm ${color}`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="text-[#75665C] text-xs font-semibold tracking-widest uppercase mb-1">{label}</p>
    <p className={`font-bold text-3xl font-display ${isCurrency ? 'text-[#590907]' : 'text-[#30231F]'}`}>{value}</p>
    {sub && <p className="text-[#75665C] text-xs mt-1 font-medium">{sub}</p>}
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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#D4BEA5]">
        <div>
          <p className="text-[#75665C] text-xs font-semibold tracking-widest uppercase mb-1">Admin Panel</p>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wider text-[#30231F]">Dashboard</h1>
        </div>
        <Link to="/admin/products" className="btn-primary flex items-center gap-2 text-xs">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Package} label="Products" value={products.length} color="bg-blue-50 text-blue-800 border border-blue-200" />
        <StatCard icon={ShoppingCart} label="Orders" value={orders.length} sub={`${orders.filter(o=>(o.status?.toLowerCase() || 'pending') === 'pending').length} pending`} color="bg-amber-50 text-amber-800 border border-amber-200" />
        <StatCard icon={Users} label="Users" value={users.length} color="bg-emerald-50 text-emerald-800 border border-emerald-200" />
        <StatCard icon={DollarSign} label="Revenue" value={`₹${revenue.toLocaleString()}`} isCurrency={true} color="bg-rose-50 text-[#590907] border border-rose-200" />
      </div>

      {/* ── Product Categorization & Display Analytics ──────────────── */}
      <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#D4BEA5] pb-3">
          <div>
            <h2 className="text-[#30231F] font-bold text-sm tracking-wider uppercase flex items-center gap-2">
              <Package size={16} className="text-[#590907]" /> Product Categorization & Section Analytics
            </h2>
            <p className="text-[11px] text-[#75665C]">Real-time visibility across New Drops, Sale, and Collections</p>
          </div>
          <Link to="/admin/products" className="text-[#590907] text-xs hover:underline font-bold tracking-widest uppercase">
            Manage Products →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-1">
          <div className="p-3 bg-white border border-[#D4BEA5] rounded-xs">
            <span className="text-[10px] text-[#75665C] uppercase font-bold block mb-1">Total Products</span>
            <span className="font-display font-bold text-2xl text-[#30231F]">{products.length}</span>
          </div>

          <div className="p-3 bg-white border border-[#D4BEA5] rounded-xs">
            <span className="text-[10px] text-[#590907] uppercase font-bold block mb-1">New Drops</span>
            <span className="font-display font-bold text-2xl text-[#590907]">
              {products.filter(p => isProductNewDropActive(p)).length}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#D4BEA5] rounded-xs">
            <span className="text-[10px] text-amber-900 uppercase font-bold block mb-1">Sale Products</span>
            <span className="font-display font-bold text-2xl text-amber-900">
              {products.filter(p => p.showInSale === true || (p.salePrice && Number(p.salePrice) > 0)).length}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#D4BEA5] rounded-xs">
            <span className="text-[10px] text-emerald-900 uppercase font-bold block mb-1">Active Sale</span>
            <span className="font-display font-bold text-2xl text-emerald-700">
              {products.filter(p => isProductSaleActive(p)).length}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#D4BEA5] rounded-xs">
            <span className="text-[10px] text-[#75665C] uppercase font-bold block mb-1">Scheduled Sale</span>
            <span className="font-display font-bold text-2xl text-[#75665C]">
              {products.filter(p => p.showInSale && p.saleStartAt && new Date(p.saleStartAt).getTime() > Date.now()).length}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#D4BEA5] rounded-xs">
            <span className="text-[10px] text-[#30231F] uppercase font-bold block mb-1">Collections</span>
            <span className="font-display font-bold text-2xl text-[#30231F]">
              {products.filter(p => p.showInCollections !== false).length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[#30231F] font-bold text-sm tracking-wider uppercase">Recent Orders</h2>
            <Link to="/admin/orders" className="text-[#590907] text-xs hover:underline font-semibold tracking-widest uppercase">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#D4BEA5]">
                  {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-[#75665C] text-left text-xs font-semibold tracking-widest uppercase pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map(order => (
                  <tr key={order.id} className="border-b border-[#D4BEA5] group hover:bg-[#E8D2B5]/30 transition-colors">
                    <td className="py-3 pr-4 text-[#590907] text-xs font-mono font-bold flex items-center gap-2">
                      #{order.id.slice(0, 8)}
                      <button onClick={() => copyToClipboard(order.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#75665C] hover:text-[#30231F]">
                        {copiedId === order.id ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-[#30231F] text-xs font-medium">{order.address?.name || order.userEmail || 'Customer'}</td>
                    <td className="py-3 pr-4 text-[#590907] text-xs font-bold">₹{order.total?.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={order.status?.toLowerCase() || 'pending'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`text-[11px] uppercase font-bold tracking-wider px-2 py-1 rounded-sm border cursor-pointer outline-none ${
                          (order.status?.toLowerCase() || 'pending') === 'delivered' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          (order.status?.toLowerCase() || 'pending') === 'shipped' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          (order.status?.toLowerCase() || 'pending') === 'cancelled' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                          'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#FAF5ED] text-[#30231F] font-medium uppercase">{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 text-[#75665C] text-xs font-medium">
                      {order.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || 'Recently'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers Side Panel */}
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#D4BEA5]">
            <TrendingUp size={18} className="text-[#590907]" />
            <h2 className="text-[#30231F] font-bold tracking-widest uppercase text-sm">Best Sellers</h2>
          </div>
          
          <div className="space-y-4">
            {bestSellers.length === 0 ? (
              <p className="text-[#75665C] text-xs py-4 text-center">No sales data recorded yet.</p>
            ) : (
              bestSellers.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group p-2 hover:bg-[#E8D2B5]/30 rounded-sm transition-colors">
                  <div className="relative w-12 h-14 bg-[#E8D2B5] border border-[#D4BEA5] overflow-hidden shrink-0 rounded-xs">
                    <img src={item.image || 'https://placehold.co/40x50/141414/888888?text=VY'} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#30231F] text-xs font-bold truncate uppercase tracking-wider">{item.name}</p>
                    <p className="text-[#75665C] text-[10px] uppercase tracking-[0.15em] font-medium mt-0.5">{item.qty} Sold</p>
                  </div>
                  <div className={`w-1 h-8 ${i === 0 ? 'bg-[#590907]' : 'bg-[#D4BEA5]'} transition-all`} />
                </div>
              ))
            )}
          </div>

          <div className="mt-8 p-4 border border-[#D4BEA5] bg-[#E8D2B5]/30 rounded-sm">
            <p className="text-[#75665C] text-[10px] uppercase tracking-[0.2em] mb-1.5 font-bold">Quick Insights</p>
            <p className="text-[#30231F] text-xs leading-relaxed">
              Your average order value is <span className="text-[#590907] font-bold">₹{Math.round(revenue / (orders.filter(o=>o.status!=='cancelled').length || 1)).toLocaleString()}</span>. 
              {bestSellers[0] && ` ${bestSellers[0].name} is currently your most popular drop.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
