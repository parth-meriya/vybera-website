import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Plus } from 'lucide-react';
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

const STATUS_OPTIONS = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

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
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const handleStatusChange = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const statusClass = {
    Pending: 'badge-pending',
    Shipped: 'badge-shipped',
    Delivered: 'badge-delivered',
    Cancelled: 'badge-cancelled',
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
        <StatCard icon={ShoppingCart} label="Orders" value={orders.length} sub={`${orders.filter(o=>o.status==='Pending').length} pending`} color="text-yellow-400" />
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
                  <tr key={order.id} className="border-b border-vy-border/50">
                    <td className="py-3 pr-4 text-vy-grey text-xs font-mono">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 pr-4 text-vy-white text-xs">{order.address?.name || order.userEmail}</td>
                    <td className="py-3 pr-4 text-vy-white text-xs font-semibold">₹{order.total?.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs bg-transparent border-0 outline-none cursor-pointer ${statusClass[order.status] || 'badge-pending'}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-vy-dark text-vy-white">{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 text-vy-grey text-xs">
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
