/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../firebase/users';
import { getOrdersByUser, createOrder, deleteOrder, updateOrderFull } from '../../firebase/orders';
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, Search, User, Plus, X, Package, Trash2, Edit2, Eye, RotateCw, RefreshCw, Sparkles, Ticket, ShoppingBag, Calendar, Wallet, Activity } from 'lucide-react';
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
  const [drawerTab, setDrawerTab] = useState('overview'); // overview | orders | rewards | audit

  // Filter States
  const [filterRole, setFilterRole] = useState('all'); // all | user | admin
  const [filterJoined, setFilterJoined] = useState('all'); // all | today | week | month
  const [filterReferral, setFilterReferral] = useState('all'); // all | has_referrals | no_referrals

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
      // Sync expired points prior to loading drawer data
      await fetch('/api/sync-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid })
      }).catch(err => console.error('Admin rewards sync failed:', err));

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

  // Filter users by search & filter states
  const filteredUsers = users.filter(user => {
    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch = (
        (user.name || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q) ||
        (user.phoneNumber || '').includes(q)
      );
      if (!matchSearch) return false;
    }
    
    // 2. Filter Role
    if (filterRole !== 'all') {
      const role = user.role || 'user';
      if (role !== filterRole) return false;
    }
    
    // 3. Filter Joined Date
    if (filterJoined !== 'all') {
      const date = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      const diffTime = Math.abs(new Date() - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (filterJoined === 'today' && diffDays > 1) return false;
      if (filterJoined === 'week' && diffDays > 7) return false;
      if (filterJoined === 'month' && diffDays > 30) return false;
    }
    
    // 4. Filter Referrals
    if (filterReferral !== 'all') {
      const count = users.filter(u => u.referredBy === (user.uid || user.id)).length;
      if (filterReferral === 'has_referrals' && count === 0) return false;
      if (filterReferral === 'no_referrals' && count > 0) return false;
    }
    
    return true;
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
    <div className="p-8 space-y-6">
      <div className="mb-6 pb-4 border-b border-[#D4BEA5] flex items-end justify-between">
        <div>
          <p className="text-[#75665C] text-xs font-semibold tracking-widest uppercase mb-1">Admin Panel</p>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wider text-[#30231F]">
            Customers <span className="text-[#75665C] font-normal text-lg">({filteredUsers.length}{filteredUsers.length !== users.length ? ` / ${users.length}` : ''})</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          title="Synchronize live users from database"
          className="flex items-center gap-2 px-3.5 py-2 border text-xs font-semibold tracking-widest uppercase bg-[#FAF5ED] border-[#D4BEA5] text-[#30231F] hover:bg-[#E8D2B5] transition-all rounded-sm shadow-xs disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-[#590907]' : 'text-[#75665C]'} />
          <span>{loading ? 'Syncing...' : 'Refresh Users'}</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75665C]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="vy-input pl-9 w-full text-xs"
          />
        </div>

        <select 
          value={filterRole} 
          onChange={e => setFilterRole(e.target.value)} 
          className="vy-input text-xs w-36 cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>

        <select 
          value={filterJoined} 
          onChange={e => setFilterJoined(e.target.value)} 
          className="vy-input text-xs w-36 cursor-pointer"
        >
          <option value="all">Joined: All Time</option>
          <option value="today">Joined: Today</option>
          <option value="week">Joined: This Week</option>
          <option value="month">Joined: This Month</option>
        </select>

        <select 
          value={filterReferral} 
          onChange={e => setFilterReferral(e.target.value)} 
          className="vy-input text-xs w-36 cursor-pointer"
        >
          <option value="all">All Referrals</option>
          <option value="has_referrals">Has Referrals</option>
          <option value="no_referrals">No Referrals</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] shadow-sm overflow-hidden rounded-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#D4BEA5] bg-[#FAF5ED]">
                {['Customer', 'Email', 'Phone', 'Role', 'Joined', 'Contact'].map(h => (
                  <th key={h} className="text-[#75665C] text-xs font-bold tracking-widest uppercase text-left px-4 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const uid = user.uid || user.id;
                const isDetailOpen = selectedUserId === uid;
                return (
                  <tr 
                    key={user.id} 
                    className={`border-b border-[#D4BEA5] hover:bg-[#E8D2B5]/30 transition-colors cursor-pointer ${isDetailOpen ? 'bg-[#E8D2B5]/40' : ''}`} 
                    onClick={() => {
                      fetchUserDetail(uid);
                      setDrawerTab('overview');
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#E8D2B5] border border-[#D4BEA5] flex items-center justify-center shrink-0">
                          <User size={13} className="text-[#590907]" />
                        </div>
                        <span className="text-[#30231F] text-xs font-bold">{user.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-[#75665C] shrink-0" />
                        <span className="text-[#75665C] text-xs font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.phoneNumber ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-[#75665C] shrink-0" />
                          <span className="text-[#590907] text-xs font-mono font-bold">+91 {user.phoneNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[#75665C] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-xs font-bold border ${user.role === 'admin' ? 'text-purple-900 border-purple-300 bg-purple-100' : 'text-[#30231F] border-[#D4BEA5] bg-[#E8D2B5]'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#75665C] text-xs font-medium">
                      {user.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {/* WhatsApp Button */}
                        {user.phoneNumber && (
                          <button
                            onClick={() => handleWhatsApp(user.phoneNumber, user.name)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-950 text-[10px] font-bold tracking-wider uppercase hover:bg-emerald-200 transition-all rounded-xs"
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
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FAF5ED] border border-[#D4BEA5] text-[#590907] text-[10px] font-bold tracking-wider uppercase hover:bg-[#E8D2B5] transition-all rounded-xs"
                          title="Add Manual Order"
                        >
                          <Plus size={12} /> Add Order
                        </button>
                      </div>
                    </td>
                  </tr>
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

      {/* Slide-over Drawer for Selected User Details */}
      <AnimatePresence>
        {selectedUserId && (() => {
          const selectedUser = users.find(u => (u.uid || u.id) === selectedUserId);
          if (!selectedUser) return null;
          
          const referralCount = users.filter(u => u.referredBy === selectedUserId).length;
          
          // Construct chronological events for the user audit timeline
          const auditTimeline = [
            {
              id: 'signup',
              date: selectedUser.createdAt?.toDate?.() || new Date(selectedUser.createdAt || Date.now()),
              title: 'Account Registered',
              desc: `Joined VYBERA via ${selectedUser.provider || 'email'} auth.`
            },
            ...userDetail.orders.map(o => ({
              id: o.id,
              date: o.createdAt?.toDate?.() || new Date(o.createdAt),
              title: 'Order Placed',
              desc: `Order #${o.id.slice(0, 8)} worth ₹${o.total.toLocaleString()} confirmed (${o.status}).`
            })),
            ...userDetail.spinHistory.map(s => ({
              id: s.id,
              date: s.timestamp?.toDate?.() || new Date(s.timestamp),
              title: 'Spin Wheel Participated',
              desc: `Spun the wheel and won ${s.rewardWon || 'No Reward'}.`
            }))
          ].sort((a, b) => b.date - a.date);

          return (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedUserId(null)}
                className="absolute inset-0 bg-vy-black/80 backdrop-blur-sm"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                className="relative w-full max-w-2xl bg-[#FAF5ED] border-l border-[#D4BEA5] h-full flex flex-col z-10 shadow-2xl"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#D4BEA5] flex items-center justify-between sticky top-0 bg-[#FAF5ED] z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8D2B5] border border-[#D4BEA5] flex items-center justify-center">
                      <User size={18} className="text-[#590907]" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-[#30231F] tracking-wider uppercase truncate max-w-xs">{selectedUser.name || 'Customer'}</h3>
                      <p className="text-[#75665C] text-xs font-semibold tracking-widest uppercase">ID: {selectedUserId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUserId(null)} className="text-[#75665C] hover:text-[#30231F] transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Tab select bar */}
                <div className="flex border-b border-[#D4BEA5] bg-[#E8D2B5]/40">
                  {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'orders', label: 'Orders', icon: ShoppingBag },
                    { id: 'rewards', label: 'Rewards & Coupons', icon: Ticket },
                    { id: 'audit', label: 'Audit Log', icon: Activity }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = drawerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDrawerTab(tab.id)}
                        className={`flex-1 py-3.5 text-center text-xs uppercase tracking-widest font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                          isActive 
                            ? 'border-[#590907] text-[#590907] bg-[#FAF5ED]' 
                            : 'border-transparent text-[#75665C] hover:text-[#30231F] hover:bg-[#FAF5ED]/50'
                        }`}
                      >
                        <Icon size={13} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Body - Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAF5ED]">
                  {detailLoading ? (
                    <div className="h-64 flex flex-col justify-center items-center gap-3">
                      <div className="spinner" />
                      <span className="text-[#75665C] text-xs uppercase tracking-widest font-semibold">Loading Customer History...</span>
                    </div>
                  ) : (
                    <>
                      {/* Tab 1: Overview */}
                      {drawerTab === 'overview' && (
                        <div className="space-y-6">
                          {/* Metadata Grid */}
                          <div className="grid grid-cols-2 gap-4 bg-[#E8D2B5]/30 border border-[#D4BEA5] p-4 rounded-sm">
                            <div>
                              <p className="text-[#75665C] text-[10px] tracking-widest uppercase font-bold mb-1">Email</p>
                              <p className="text-[#30231F] text-xs font-bold">{selectedUser.email || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[#75665C] text-[10px] tracking-widest uppercase font-bold mb-1">Mobile Phone</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[#590907] text-xs font-bold font-mono">{selectedUser.phoneNumber ? `+91 ${selectedUser.phoneNumber}` : '—'}</p>
                                {selectedUser.phoneNumber && (
                                  <button
                                    onClick={() => handleWhatsAppVerification(selectedUser.phoneNumber, selectedUser.name)}
                                    className="text-[10px] text-emerald-800 hover:underline uppercase font-bold tracking-widest ml-1"
                                    title="Send WhatsApp Verification Link"
                                  >
                                    Verify
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[#75665C] text-[10px] tracking-widest uppercase font-bold mb-1">Date Joined</p>
                              <p className="text-[#30231F] text-xs font-semibold">{selectedUser.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[#75665C] text-[10px] tracking-widest uppercase font-bold mb-1">Role Privileges</p>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-xs font-bold border ${selectedUser.role === 'admin' ? 'text-purple-900 border-purple-300 bg-purple-100' : 'text-[#30231F] border-[#D4BEA5] bg-[#E8D2B5]'}`}>
                                {selectedUser.role || 'user'}
                              </span>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-4 text-center rounded-sm shadow-xs">
                              <Wallet size={22} className="text-[#590907] mx-auto mb-1" />
                              <span className="text-[10px] text-[#75665C] uppercase tracking-widest block font-semibold">Wallet Balance</span>
                              <span className="text-xl font-bold text-[#590907] font-display mt-1 block">{selectedUser.rewardPoints || 0} pts</span>
                            </div>
                            <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-4 text-center rounded-sm shadow-xs">
                              <Users size={22} className="text-[#590907] mx-auto mb-1" />
                              <span className="text-[10px] text-[#75665C] uppercase tracking-widest block font-semibold">Referrals Invited</span>
                              <span className="text-xl font-bold text-[#30231F] font-display mt-1 block">{referralCount} Users</span>
                            </div>
                            <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-4 text-center rounded-sm shadow-xs">
                              <ShoppingBag size={22} className="text-[#590907] mx-auto mb-1" />
                              <span className="text-[10px] text-[#75665C] uppercase tracking-widest block font-semibold">Total Purchases</span>
                              <span className="text-xl font-bold text-[#30231F] font-display mt-1 block">{userDetail.orders.length} Orders</span>
                            </div>
                          </div>

                          {/* Actions Panel */}
                          <div className="bg-[#E8D2B5]/30 border border-[#D4BEA5] p-4 space-y-3 rounded-sm">
                            <h4 className="text-[#30231F] text-xs tracking-widest uppercase font-bold">Contact & Quick Actions</h4>
                            <div className="flex flex-wrap gap-2.5">
                              {selectedUser.phoneNumber && (
                                <button
                                  onClick={() => handleWhatsApp(selectedUser.phoneNumber, selectedUser.name)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold tracking-wider uppercase hover:bg-emerald-200 transition-all rounded-sm shadow-xs"
                                >
                                  <MessageCircle size={14} /> WhatsApp Chat
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setAddingOrderFor(selectedUser);
                                  setManualForm(prev => ({
                                    ...prev,
                                    customerName: selectedUser.name || '',
                                    customerPhone: selectedUser.phoneNumber || ''
                                  }));
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FAF5ED] border border-[#D4BEA5] text-[#590907] text-xs font-bold tracking-wider uppercase hover:bg-[#E8D2B5] transition-all rounded-sm shadow-xs"
                              >
                                <Plus size={14} /> Add Manual Order
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Orders */}
                      {drawerTab === 'orders' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-vy-grey text-[10px] tracking-widest uppercase font-bold">Order History</h4>
                            <button
                              onClick={() => {
                                setAddingOrderFor(selectedUser);
                                setManualForm(prev => ({
                                  ...prev,
                                  customerName: selectedUser.name || '',
                                  customerPhone: selectedUser.phoneNumber || ''
                                }));
                              }}
                              className="btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1"
                            >
                              <Plus size={12} /> New Manual Order
                            </button>
                          </div>

                          {userDetail.orders.length === 0 ? (
                            <p className="text-vy-grey text-xs py-12 text-center border border-vy-border bg-vy-black/10">No orders found for this customer.</p>
                          ) : (
                            <div className="space-y-3">
                              {userDetail.orders.map(order => (
                                <div key={order.id} className="bg-vy-black/35 border border-vy-border p-4 flex flex-col justify-between hover:bg-vy-black/50 transition-all">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="text-[10px] font-mono text-vy-light font-bold">Order: {order.id.slice(0, 16)}...</p>
                                      <span className="text-[9px] text-vy-grey mt-0.5 block">{order.createdAt?.toDate?.()?.toLocaleString('en-IN') || '—'}</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 border uppercase tracking-wider font-semibold ${
                                      order.status === 'delivered' ? 'text-green-400 border-green-500/20 bg-green-500/5' :
                                      order.status === 'shipped' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' :
                                      order.status === 'cancelled' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
                                    }`}>{order.status}</span>
                                  </div>

                                  {/* Product items display */}
                                  <div className="space-y-1 mb-3 bg-vy-black/20 p-2">
                                    {(order.products || []).map((p, idx) => (
                                      <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-vy-light truncate max-w-sm">{p.name} ({p.size || 'Free'}) x{p.quantity || 1}</span>
                                        <span className="text-vy-grey">₹{p.price || 0}</span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex justify-between items-center border-t border-vy-border/40 pt-3">
                                    <div>
                                      <span className="text-vy-grey text-[9px] uppercase tracking-widest block">Total Amount</span>
                                      <span className="text-vy-white font-bold text-sm font-display">₹{order.total?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      {order.paymentMethod === 'Manual/Offline' ? (
                                        <>
                                          <button 
                                            onClick={() => {
                                              setAddingOrderFor(selectedUser);
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
                                            className="p-1.5 border border-vy-border text-blue-400 hover:text-blue-300"
                                            title="Edit Manual Order"
                                          >
                                            <Edit2 size={12} />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteOrder(selectedUserId, order.id)}
                                            className="p-1.5 border border-vy-border text-red-500 hover:text-red-400"
                                            title="Delete Manual Order"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-vy-border text-[9px] uppercase tracking-widest font-bold">Web Order</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 3: Rewards & Coupons */}
                      {drawerTab === 'rewards' && (
                        <div className="space-y-6">
                          {/* Coupons Section */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Ticket size={13} className="text-vy-gold" />
                              <h4 className="text-vy-gold text-[10px] tracking-widest uppercase font-bold">Reward Coupons</h4>
                              <span className="text-vy-grey text-[10px]">({userDetail.coupons.length})</span>
                            </div>

                            {userDetail.coupons.length === 0 ? (
                              <p className="text-vy-grey text-xs py-8 text-center border border-vy-border bg-vy-black/10">No coupons generated for this user.</p>
                            ) : (
                              <div className="border border-vy-border bg-vy-black/20 overflow-hidden">
                                <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-vy-black text-[9px] text-vy-grey uppercase tracking-widest font-bold">
                                  <span>Code</span>
                                  <span>Value</span>
                                  <span>Status</span>
                                  <span>Expiry</span>
                                </div>
                                {userDetail.coupons.map(coupon => {
                                  const isExpired = coupon.expiry && new Date(coupon.expiry) < new Date();
                                  const status = coupon.used ? 'Used' : isExpired ? 'Expired' : 'Active';
                                  return (
                                    <div key={coupon.id} className="grid grid-cols-4 gap-4 px-4 py-2.5 border-t border-vy-border/40 hover:bg-vy-border/10 text-xs">
                                      <span className="font-mono text-vy-white font-bold">{coupon.code}</span>
                                      <span className="text-vy-light">{coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}</span>
                                      <span className={`font-semibold ${coupon.used ? 'text-vy-grey' : isExpired ? 'text-red-400' : 'text-green-400'}`}>{status}</span>
                                      <span className="text-vy-grey">{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : '—'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Spin Wheel History */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={13} className="text-[#590907]" />
                              <h4 className="text-[#590907] text-[10px] tracking-widest uppercase font-bold">Spin History</h4>
                              <span className="text-[#75665C] text-[10px]">({userDetail.spinHistory.length})</span>
                            </div>

                            {userDetail.spinHistory.length === 0 ? (
                              <p className="text-vy-grey text-xs py-8 text-center border border-vy-border bg-vy-black/10">No spin history found for this user.</p>
                            ) : (
                              <div className="border border-vy-border bg-vy-black/20 overflow-hidden">
                                <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-vy-black text-[9px] text-vy-grey uppercase tracking-widest font-bold">
                                  <span>Campaign</span>
                                  <span>Reward Won</span>
                                  <span>Date</span>
                                </div>
                                {userDetail.spinHistory.map(spin => (
                                  <div key={spin.id} className="grid grid-cols-3 gap-4 px-4 py-2.5 border-t border-vy-border/40 hover:bg-vy-border/10 text-xs">
                                    <span className="text-vy-white font-medium uppercase tracking-wider text-[10px]">{spin.campaignId}</span>
                                    <span className="text-vy-gold font-semibold">{spin.rewardWon}</span>
                                    <span className="text-vy-grey">{spin.timestamp?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tab 4: Audit Logs */}
                      {drawerTab === 'audit' && (
                        <div className="space-y-4">
                          <h4 className="text-vy-grey text-[10px] tracking-widest uppercase font-bold mb-4">Customer Action Audit Log</h4>
                          <div className="relative border-l border-vy-border pl-6 space-y-6">
                            {auditTimeline.map((evt, idx) => (
                              <div key={idx} className="relative">
                                {/* Dot icon */}
                                <span className="absolute -left-[30px] top-0.5 rounded-full border border-vy-border bg-vy-card p-1 text-vy-grey">
                                  <Calendar size={8} />
                                </span>
                                <div>
                                  <span className="text-[9px] text-vy-grey font-bold uppercase tracking-widest">
                                    {evt.date.toLocaleString('en-IN')}
                                  </span>
                                  <h4 className="text-xs font-bold text-vy-white uppercase tracking-wider mt-0.5">{evt.title}</h4>
                                  <p className="text-xs text-vy-grey mt-0.5 leading-relaxed">{evt.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

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
