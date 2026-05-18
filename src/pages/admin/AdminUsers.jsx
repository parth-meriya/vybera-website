import { useEffect, useState } from 'react';
import { getAllUsers } from '../../firebase/users';
import { getOrdersByUser } from '../../firebase/orders';
import { ChevronDown, ChevronUp } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [userOrders, setUserOrders] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(null);

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Users ({users.length})</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-vy-card border border-vy-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vy-border">
                {['Name', 'Email', 'Mobile', 'Role', 'Joined', 'Orders'].map(h => (
                  <th key={h} className="text-vy-grey text-xs tracking-widest uppercase text-left px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <>
                  <tr key={user.id} className="border-b border-vy-border/50 hover:bg-vy-border/20 transition-colors">
                    <td className="px-4 py-3 text-vy-white text-xs font-medium">{user.name || '—'}</td>
                    <td className="px-4 py-3 text-vy-grey text-xs">{user.email}</td>
                    <td className="px-4 py-3 text-vy-grey text-xs">{user.phoneNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 border ${user.role === 'admin' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' : 'text-vy-grey border-vy-border'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-vy-grey text-xs">
                      {user.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUser(user.uid || user.id)}
                        className="flex items-center gap-1 text-vy-grey text-xs hover:text-vy-white transition-colors"
                      >
                        History {expanded === (user.uid || user.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
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
                            {userOrders[user.uid || user.id].map(order => (
                              <div key={order.id} className="flex items-center justify-between bg-vy-border/20 px-4 py-2">
                                <span className="text-vy-grey text-xs font-mono">{order.id.slice(0, 12)}...</span>
                                <span className="text-vy-white text-xs">₹{order.total?.toLocaleString()}</span>
                                <span className={`text-xs ${
                                  order.status === 'Delivered' ? 'text-green-400' :
                                  order.status === 'Shipped' ? 'text-blue-400' :
                                  order.status === 'Cancelled' ? 'text-red-400' : 'text-yellow-400'
                                }`}>{order.status}</span>
                                <span className="text-vy-grey text-xs">{order.createdAt?.toDate?.()?.toLocaleDateString()}</span>
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
          {users.length === 0 && (
            <div className="text-center py-16">
              <p className="text-vy-grey text-sm tracking-widest uppercase">No users yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
