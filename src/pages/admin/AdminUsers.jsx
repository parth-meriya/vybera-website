import { useEffect, useState } from 'react';
import { getAllUsers } from '../../firebase/users';
import { getOrdersByUser, createOrder } from '../../firebase/orders';
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, Search, User, Plus, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [userOrders, setUserOrders] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Order State
  const [addingOrderFor, setAddingOrderFor] = useState(null);
  const [manualForm, setManualForm] = useState({ 
    productName: 'VYBERA Offline Order', amount: '', size: 'Free', color: 'Black', qty: 1, status: 'confirmed',
    customerName: '', customerPhone: '', street: '', city: '', state: '', pincode: ''
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

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

  const handleCreateManualOrder = async () => {
    if (!manualForm.amount || manualForm.amount <= 0) {
      toast.error('Please enter a valid amount.', { className: 'toast-vybera' });
      return;
    }
    setSubmittingOrder(true);
    try {
      const u = addingOrderFor;
      const uid = u.uid || u.id;
      const orderData = {
        userId: uid,
        customerName: manualForm.customerName || u.name || 'Customer',
        customerEmail: u.email,
        customerPhone: manualForm.customerPhone || u.phoneNumber || '',
        total: Number(manualForm.amount),
        status: manualForm.status,
        paymentMethod: 'Manual/Offline',
        paymentStatus: 'paid',
        address: {
          fullName: manualForm.customerName || u.name || 'Customer',
          phone: manualForm.customerPhone || u.phoneNumber || '',
          street: manualForm.street || 'Manual Order Entry',
          city: manualForm.city || 'NA', 
          state: manualForm.state || 'NA', 
          pincode: manualForm.pincode || '000000'
        },
        products: [{
          name: manualForm.productName || 'Manual Order',
          size: manualForm.size || 'Free',
          color: manualForm.color || 'Black',
          quantity: Number(manualForm.qty) || 1,
          price: Number(manualForm.amount),
          isCustom: true
        }]
      };
      
      await createOrder(orderData);
      toast.success('Manual order created successfully!', { className: 'toast-vybera' });
      setAddingOrderFor(null);
      setManualForm({ 
        productName: 'VYBERA Offline Order', amount: '', size: 'Free', color: 'Black', qty: 1, status: 'confirmed',
        customerName: '', customerPhone: '', street: '', city: '', state: '', pincode: ''
      });
      
      // Refresh user's orders if expanded
      if (expanded === uid) {
        const orders = await getOrdersByUser(uid);
        setUserOrders(prev => ({ ...prev, [uid]: orders }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create manual order.', { className: 'toast-vybera' });
    } finally {
      setSubmittingOrder(false);
    }
  };

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
                        {/* Add Manual Order Button */}
                        <button
                          onClick={() => {
                            setAddingOrderFor(user);
                            setManualForm(prev => ({
                              ...prev,
                              customerName: user.name || '',
                              customerPhone: user.phoneNumber || ''
                            }));
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-vy-accent/10 border border-vy-accent/30 text-vy-accent text-[10px] font-bold tracking-wider uppercase hover:bg-vy-accent/20 transition-all"
                          title="Add Manual Order"
                        >
                          <Plus size={12} /> Add Order
                        </button>
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

      {/* Manual Order Modal */}
      {addingOrderFor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto py-10" onClick={() => setAddingOrderFor(null)}>
          <div className="bg-vy-dark border border-vy-border w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-vy-border sticky top-0 bg-vy-dark z-10">
              <h2 className="text-vy-white text-sm font-semibold tracking-wider flex items-center gap-2">
                <Package size={16} className="text-vy-accent" />
                New Manual Order
              </h2>
              <button onClick={() => setAddingOrderFor(null)} className="text-vy-grey hover:text-vy-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Product Info Section */}
              <div>
                <h3 className="text-vy-accent text-[10px] uppercase tracking-widest mb-3 border-b border-vy-border/50 pb-2">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Product / Description</label>
                    <input 
                      value={manualForm.productName}
                      onChange={e => setManualForm(p => ({ ...p, productName: e.target.value }))}
                      className="vy-input text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Total Amount (₹)</label>
                    <input 
                      type="number"
                      value={manualForm.amount}
                      onChange={e => setManualForm(p => ({ ...p, amount: e.target.value }))}
                      className="vy-input text-xs" 
                      placeholder="e.g. 1500"
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Quantity</label>
                    <input 
                      type="number" min="1"
                      value={manualForm.qty}
                      onChange={e => setManualForm(p => ({ ...p, qty: e.target.value }))}
                      className="vy-input text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Size</label>
                    <select 
                      value={manualForm.size}
                      onChange={e => setManualForm(p => ({ ...p, size: e.target.value }))}
                      className="vy-input text-xs cursor-pointer"
                    >
                      <option value="Free">Free / Custom</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Color</label>
                    <input 
                      value={manualForm.color}
                      onChange={e => setManualForm(p => ({ ...p, color: e.target.value }))}
                      className="vy-input text-xs" 
                      placeholder="e.g. Black"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Order Status</label>
                    <select 
                      value={manualForm.status}
                      onChange={e => setManualForm(p => ({ ...p, status: e.target.value }))}
                      className="vy-input text-xs cursor-pointer"
                    >
                      <option value="confirmed">Confirmed (Paid)</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Shipping Address Section */}
              <div>
                <h3 className="text-vy-accent text-[10px] uppercase tracking-widest mb-3 border-b border-vy-border/50 pb-2">Shipping Information (For Label)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Customer Name</label>
                    <input 
                      value={manualForm.customerName}
                      onChange={e => setManualForm(p => ({ ...p, customerName: e.target.value }))}
                      className="vy-input text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Phone Number</label>
                    <input 
                      value={manualForm.customerPhone}
                      onChange={e => setManualForm(p => ({ ...p, customerPhone: e.target.value }))}
                      className="vy-input text-xs" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Full Street Address</label>
                    <textarea 
                      value={manualForm.street}
                      onChange={e => setManualForm(p => ({ ...p, street: e.target.value }))}
                      className="vy-input text-xs resize-none" 
                      rows={2}
                      placeholder="House No, Building, Street, Area..."
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">City</label>
                    <input 
                      value={manualForm.city}
                      onChange={e => setManualForm(p => ({ ...p, city: e.target.value }))}
                      className="vy-input text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">State</label>
                    <input 
                      value={manualForm.state}
                      onChange={e => setManualForm(p => ({ ...p, state: e.target.value }))}
                      className="vy-input text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Pincode</label>
                    <input 
                      value={manualForm.pincode}
                      onChange={e => setManualForm(p => ({ ...p, pincode: e.target.value }))}
                      className="vy-input text-xs font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 sticky bottom-0 bg-vy-dark border-t border-vy-border py-4">
                <button 
                  onClick={() => setAddingOrderFor(null)}
                  className="btn-ghost flex-1 text-xs py-3"
                  disabled={submittingOrder}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateManualOrder}
                  className="btn-primary flex-1 text-xs py-3"
                  disabled={submittingOrder}
                >
                  {submittingOrder ? 'Creating Order...' : 'Create Order & Label'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
