/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../firebase/users';
import { getOrdersByUser, createOrder, deleteOrder, updateOrderFull } from '../../firebase/orders';
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, Search, User, Plus, X, Package, Trash2, Edit2, Eye, RotateCw, Ticket, ShoppingBag, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [userOrders, setUserOrders] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // User Detail Panel State
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState({ spinHistory: [], coupons: [], orders: [] });
  const [detailLoading, setDetailLoading] = useState(false);

  // Manual Order State
  const [addingOrderFor, setAddingOrderFor] = useState(null);
  const [manualForm, setManualForm] = useState({ 
    productName: 'VYBERA Offline Order', amount: '', size: 'Free', color: 'Black', qty: 1, status: 'confirmed',
    customerName: '', customerPhone: '', street: '', city: '', state: '', pincode: ''
  });
  const [editingOrderId, setEditingOrderId] = useState(null);
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

  const fetchUserDetail = async (uid) => {
    if (selectedUserId === uid) {
      setSelectedUserId(null);
      return;
    }
    setSelectedUserId(uid);
    setDetailLoading(true);
    try {
      const [spinSnap, couponSnap, orderSnap] = await Promise.all([
        getDocs(query(collection(db, 'spinResults'), where('uid', '==', uid))),
        getDocs(query(collection(db, 'coupons'), where('uid', '==', uid))),
        getDocs(query(collection(db, 'orders'), where('userId', '==', uid)))
      ]);

      const spinHistory = spinSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));

      const coupons = couponSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

      const orders = orderSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

      setUserDetail({ spinHistory, coupons, orders });
    } catch (err) {
      console.error('Error fetching user detail:', err);
      toast.error('Failed to load user details', { className: 'toast-vybera' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleWhatsApp = (phone, name) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) return;
    const finalPhone = '91' + cleanPhone;
    const msg = `Hello from VYBERA regarding your order.`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleWhatsAppVerification = (phone, name) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Invalid phone number format. Must be 10 digits.');
      return;
    }
    const finalPhone = '91' + cleanPhone;
    const msg = `Hello ${name || 'there'}, this is VYBERA support. We are verifying your account for the QR Spin Wheel Campaign. Please reply to this message to verify your mobile number. Thank you!`;
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
      
      if (editingOrderId) {
        await updateOrderFull(editingOrderId, orderData);
        toast.success('Order updated successfully!', { className: 'toast-vybera' });
      } else {
        await createOrder(orderData);
        toast.success('Manual order created successfully!', { className: 'toast-vybera' });
      }

      setAddingOrderFor(null);
      setEditingOrderId(null);
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
      toast.error('Failed to save manual order.', { className: 'toast-vybera' });
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleDeleteOrder = async (uid, orderId) => {
    if (!window.confirm('Are you sure you want to delete this manual order? This cannot be undone.')) return;
    try {
      await deleteOrder(orderId);
      toast.success('Order deleted.', { className: 'toast-vybera' });
      const orders = await getOrdersByUser(uid);
      setUserOrders(prev => ({ ...prev, [uid]: orders }));
    } catch (err) {
      toast.error('Failed to delete order.', { className: 'toast-vybera' });
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
              {filteredUsers.map(user => {
                const uid = user.uid || user.id;
                const isDetailOpen = selectedUserId === uid;
                return (
                <React.Fragment key={user.id}>
                  <tr className={`border-b border-vy-border/50 hover:bg-vy-border/20 transition-colors cursor-pointer ${isDetailOpen ? 'bg-vy-border/10' : ''}`} onClick={() => fetchUserDetail(uid)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-vy-border/30 flex items-center justify-center shrink-0">
                          <User size={12} className="text-vy-grey" />
                        </div>
                        <span className="text-vy-white text-xs font-medium">{user.name || '—'}</span>
                        {isDetailOpen ? <ChevronUp size={12} className="text-vy-accent" /> : <ChevronDown size={12} className="text-vy-grey" />}
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
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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
                          onClick={() => toggleUser(uid)}
                          className="flex items-center gap-1 text-vy-grey text-xs hover:text-vy-white transition-colors"
                        >
                          Orders {expanded === uid ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable User Detail Panel */}
                  <AnimatePresence>
                    {isDetailOpen && (
                      <tr key={`${user.id}-detail`}>
                        <td colSpan={6} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden border-b border-vy-accent/20 bg-vy-black/40"
                          >
                            <div className="px-8 py-6">
                              {detailLoading ? (
                                <div className="flex items-center justify-center py-8 gap-3">
                                  <div className="spinner" />
                                  <span className="text-vy-grey text-xs tracking-widest uppercase">Loading user details...</span>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  {/* Profile Summary */}
                                  <div className="grid grid-cols-5 gap-4 bg-vy-card border border-vy-border p-4">
                                    <div>
                                      <p className="text-vy-grey text-[9px] tracking-widest uppercase mb-1">Name</p>
                                      <p className="text-vy-white text-xs font-medium">{user.name || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-vy-grey text-[9px] tracking-widest uppercase mb-1">Email</p>
                                      <p className="text-vy-white text-xs">{user.email || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-vy-grey text-[9px] tracking-widest uppercase mb-1">Phone</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-vy-white text-xs font-mono">{user.phoneNumber ? `+91 ${user.phoneNumber}` : '—'}</p>
                                        {user.phoneNumber && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleWhatsAppVerification(user.phoneNumber, user.name);
                                            }}
                                            className="text-[9px] text-green-400 hover:text-green-300 transition-colors uppercase tracking-widest underline ml-2"
                                            title="Send WhatsApp Verification Msg"
                                          >
                                            Verify Mobile
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-vy-grey text-[9px] tracking-widest uppercase mb-1">Join Date</p>
                                      <p className="text-vy-white text-xs">{user.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-vy-grey text-[9px] tracking-widest uppercase mb-1">Role</p>
                                      <span className={`text-xs px-2 py-0.5 border ${user.role === 'admin' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' : 'text-vy-grey border-vy-border'}`}>
                                        {user.role || 'user'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Spin History */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <RotateCw size={13} className="text-vy-accent" />
                                      <h4 className="text-vy-accent text-[10px] tracking-widest uppercase font-semibold">Spin History</h4>
                                      <span className="text-vy-grey text-[10px]">({userDetail.spinHistory.length})</span>
                                    </div>
                                    {userDetail.spinHistory.length === 0 ? (
                                      <p className="text-vy-grey text-xs pl-5">No spin history found</p>
                                    ) : (
                                      <div className="bg-vy-card border border-vy-border">
                                        <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-vy-border">
                                          {['Campaign', 'Reward Won', 'Type', 'Date'].map(h => (
                                            <span key={h} className="text-vy-grey text-[9px] tracking-widest uppercase font-medium">{h}</span>
                                          ))}
                                        </div>
                                        {userDetail.spinHistory.map(spin => (
                                          <div key={spin.id} className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-vy-border/30 last:border-0 hover:bg-vy-border/10">
                                            <span className="text-vy-white text-xs">{spin.campaignId || '—'}</span>
                                            <span className="text-vy-gold text-xs font-medium">{spin.rewardWon || '—'}</span>
                                            <span className="text-vy-grey text-xs">{spin.rewardType || '—'}</span>
                                            <span className="text-vy-grey text-xs">{spin.timestamp?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Coupons */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Ticket size={13} className="text-vy-gold" />
                                      <h4 className="text-vy-gold text-[10px] tracking-widest uppercase font-semibold">Coupons</h4>
                                      <span className="text-vy-grey text-[10px]">({userDetail.coupons.length})</span>
                                    </div>
                                    {userDetail.coupons.length === 0 ? (
                                      <p className="text-vy-grey text-xs pl-5">No coupons found</p>
                                    ) : (
                                      <div className="bg-vy-card border border-vy-border">
                                        <div className="grid grid-cols-5 gap-4 px-4 py-2 border-b border-vy-border">
                                          {['Code', 'Value', 'Status', 'Campaign', 'Created'].map(h => (
                                            <span key={h} className="text-vy-grey text-[9px] tracking-widest uppercase font-medium">{h}</span>
                                          ))}
                                        </div>
                                        {userDetail.coupons.map(coupon => {
                                          const isExpired = coupon.expiry && new Date(coupon.expiry) < new Date();
                                          const status = coupon.used ? 'Used' : isExpired ? 'Expired' : 'Active';
                                          const statusColor = coupon.used ? 'text-vy-grey' : isExpired ? 'text-red-400' : 'text-green-400';
                                          return (
                                            <div key={coupon.id} className="grid grid-cols-5 gap-4 px-4 py-2 border-b border-vy-border/30 last:border-0 hover:bg-vy-border/10">
                                              <span className="text-vy-white text-xs font-mono font-semibold">{coupon.code}</span>
                                              <span className="text-vy-white text-xs">
                                                {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                              </span>
                                              <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
                                              <span className="text-vy-grey text-xs">{coupon.campaignId || 'Manual'}</span>
                                              <span className="text-vy-grey text-xs">{coupon.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Order History */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <ShoppingBag size={13} className="text-blue-400" />
                                      <h4 className="text-blue-400 text-[10px] tracking-widest uppercase font-semibold">Orders</h4>
                                      <span className="text-vy-grey text-[10px]">({userDetail.orders.length})</span>
                                    </div>
                                    {userDetail.orders.length === 0 ? (
                                      <p className="text-vy-grey text-xs pl-5">No orders found</p>
                                    ) : (
                                      <div className="bg-vy-card border border-vy-border">
                                        <div className="grid grid-cols-5 gap-4 px-4 py-2 border-b border-vy-border">
                                          {['Order ID', 'Amount', 'Status', 'Coupon', 'Date'].map(h => (
                                            <span key={h} className="text-vy-grey text-[9px] tracking-widest uppercase font-medium">{h}</span>
                                          ))}
                                        </div>
                                        {userDetail.orders.map(order => (
                                          <div key={order.id} className="grid grid-cols-5 gap-4 px-4 py-2 border-b border-vy-border/30 last:border-0 hover:bg-vy-border/10">
                                            <span className="text-vy-white text-xs font-mono">{order.id.slice(0, 8)}...</span>
                                            <span className="text-vy-white text-xs font-semibold">₹{order.total?.toLocaleString()}</span>
                                            <span className={`text-xs font-medium ${
                                              order.status === 'delivered' ? 'text-green-400' :
                                              order.status === 'shipped' ? 'text-blue-400' :
                                              order.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'
                                            }`}>{order.status}</span>
                                            <span className="text-vy-grey text-xs font-mono">{order.couponCode || '—'}</span>
                                            <span className="text-vy-grey text-xs">{order.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>

                  {expanded === uid && (
                    <tr key={`${user.id}-orders`} className="border-b border-vy-border/50 bg-vy-black/20">
                      <td colSpan={6} className="px-8 py-5">
                        {loadingOrders === uid ? (
                          <div className="flex justify-center py-4"><div className="spinner" /></div>
                        ) : (userOrders[uid] || []).length === 0 ? (
                          <p className="text-vy-grey text-xs tracking-widest uppercase">No orders found</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-6 gap-4 mb-2">
                              {['Order ID', 'Amount', 'Status', 'Phone', 'Date', 'Actions'].map(h => (
                                <span key={h} className="text-vy-grey text-[10px] tracking-widest uppercase font-medium">{h}</span>
                              ))}
                            </div>
                            {userOrders[uid].map(order => (
                              <div key={order.id} className="grid grid-cols-6 gap-4 items-center bg-vy-border/20 px-4 py-2">
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
                                <div className="flex gap-2">
                                  {order.paymentMethod === 'Manual/Offline' ? (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setAddingOrderFor(user);
                                          setEditingOrderId(order.id);
                                          setManualForm({
                                            productName: order.products?.[0]?.name || 'VYBERA Offline Order',
                                            amount: order.total || '',
                                            size: order.products?.[0]?.size || 'Free',
                                            color: order.products?.[0]?.color || 'Black',
                                            qty: order.products?.[0]?.quantity || 1,
                                            status: order.status || 'confirmed',
                                            customerName: order.customerName || order.address?.fullName || '',
                                            customerPhone: order.customerPhone || order.address?.phone || '',
                                            street: order.address?.street || '',
                                            city: order.address?.city || '',
                                            state: order.address?.state || '',
                                            pincode: order.address?.pincode || ''
                                          });
                                        }}
                                        className="text-blue-400 hover:text-blue-300 transition-colors p-1" title="Edit Manual Order"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteOrder(uid, order.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete Manual Order"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-vy-border text-[9px] uppercase tracking-widest">Web Order</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto py-10" onClick={() => { setAddingOrderFor(null); setEditingOrderId(null); }}>
          <div className="bg-vy-dark border border-vy-border w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-vy-border sticky top-0 bg-vy-dark z-10">
              <h2 className="text-vy-white text-sm font-semibold tracking-wider flex items-center gap-2">
                <Package size={16} className="text-vy-accent" />
                {editingOrderId ? 'Edit Manual Order' : 'New Manual Order'}
              </h2>
              <button onClick={() => { setAddingOrderFor(null); setEditingOrderId(null); }} className="text-vy-grey hover:text-vy-white transition-colors">
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
                  onClick={() => { setAddingOrderFor(null); setEditingOrderId(null); }}
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
                  {submittingOrder ? 'Saving Order...' : (editingOrderId ? 'Update Order' : 'Create Order & Label')}
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
