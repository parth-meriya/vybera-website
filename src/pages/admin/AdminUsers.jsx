import { useEffect, useState } from 'react';
import { getAllUsers } from '../../firebase/users';
import { getOrdersByUser } from '../../firebase/orders';
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, Search, User } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [userOrders, setUserOrders] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAllUsers().then(u => { setUsers(u); setLoading(false); });
  }, []);

  const toggleUser = async (uid) => {
    if (expanded === uid) {
      setExpanded(null);
      return;
    }
    setExpanded(uid);
    if (!userOrders[uid]) {
      setLoadingOrders(uid);
      const orders = await getOrdersByUser(uid);
      setUserOrders(prev => ({ ...prev, [uid]: orders }));
      setLoadingOrders(null);
    }
  };

  // WhatsApp direct message
  const handleWhatsApp = (phone, name) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) return;
    const finalPhone = '91' + cleanPhone;
    const msg = `Hello from VYBERA regarding your order.`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filter users by search
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.phoneNumber || '').includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">
          Customers <span className="text-vy-grey font-normal text-lg">({filteredUsers.length}{filteredUsers.length !== users.length ? ` / ${users.length}` : ''})</span>
        </h1>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vy-grey" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="vy-input pl-9 w-full text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-vy-card border border-vy-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vy-border">
                {['Name', 'Email', 'Mobile', 'Role', 'Joined', 'Contact'].map(h => (
                  <th key={h} className="text-vy-grey text-xs tracking-widest uppercase text-left px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <>
                  <tr key={user.id} className="border-b border-vy-border/50 hover:bg-vy-border/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-vy-border/30 flex items-center justify-center shrink-0">
                          <User size={12} className="text-vy-grey" />
                        </div>
                        <span className="text-vy-white text-xs font-medium">{user.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Mail size={11} className="text-vy-border shrink-0" />
                        <span className="text-vy-grey text-xs">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.phoneNumber ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-vy-border shrink-0" />
                          <span className="text-vy-light text-xs font-mono">+91 {user.phoneNumber}</span>
                        </div>
                      ) : (
                        <span className="text-vy-border text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 border ${user.role === 'admin' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' : 'text-vy-grey border-vy-border'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-vy-grey text-xs">
                      {user.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* WhatsApp Button */}
                        {user.phoneNumber && (
                          <button
                            onClick={() => handleWhatsApp(user.phoneNumber, user.name)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-wider uppercase hover:bg-green-500/20 transition-all"
                            title="Message on WhatsApp"
                          >
                            <MessageCircle size={12} /> WhatsApp
                          </button>
                        )}
                        {/* Order History Toggle */}
                        <button
                          onClick={() => toggleUser(user.uid || user.id)}
                          className="flex items-center gap-1 text-vy-grey text-xs hover:text-vy-white transition-colors"
                        >
                          Orders {expanded === (user.uid || user.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === (user.uid || user.id) && (
                    <tr key={`${user.id}-orders`} className="border-b border-vy-border/50 bg-vy-black/20">
                      <td colSpan={6} className="px-8 py-5">
                        {loadingOrders === (user.uid || user.id) ? (
                          <div className="flex justify-center py-4"><div className="spinner" /></div>
                        ) : (userOrders[user.uid || user.id] || []).length === 0 ? (
                          <p className="text-vy-grey text-xs tracking-widest uppercase">No orders found</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-4 mb-2">
                              {['Order ID', 'Amount', 'Status', 'Phone', 'Date'].map(h => (
                                <span key={h} className="text-vy-grey text-[10px] tracking-widest uppercase font-medium">{h}</span>
                              ))}
                            </div>
                            {userOrders[user.uid || user.id].map(order => (
                              <div key={order.id} className="grid grid-cols-5 gap-4 items-center bg-vy-border/20 px-4 py-2">
                                <span className="text-vy-grey text-xs font-mono">{order.id.slice(0, 12)}...</span>
                                <span className="text-vy-white text-xs font-semibold">₹{order.total?.toLocaleString()}</span>
                                <span className={`text-xs ${
                                  order.status === 'delivered' ? 'text-green-400' :
                                  order.status === 'shipped' ? 'text-blue-400' :
                                  order.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'
                                }`}>{order.status}</span>
                                <span className="text-vy-light text-xs font-mono">
                                  {order.customerPhone || order.address?.phone || '—'}
                                </span>
                                <span className="text-vy-grey text-xs">{order.createdAt?.toDate?.()?.toLocaleDateString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <p className="text-vy-grey text-sm tracking-widest uppercase">
                {searchQuery ? 'No customers match your search' : 'No users yet'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
