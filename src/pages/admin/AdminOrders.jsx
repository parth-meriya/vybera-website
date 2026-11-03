import { useEffect, useState } from 'react';
import { listenToAllOrders, updateOrderStatus, updateOrderTracking, updateReturnStatus, deleteOrder, updateOrderFull } from '../../firebase/orders';
import { printShippingLabel, printOrderInvoice } from '../../utils/billGenerator';
import { motion } from 'framer-motion';
import { FileText, Package, RotateCcw, SlidersHorizontal, X, Search, ArrowUpDown, MessageCircle, Trash2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const statusClass = {
  pending: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
  confirmed: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
  processing: 'bg-blue-100 text-blue-900 border border-blue-300 font-bold',
  shipped: 'bg-purple-100 text-purple-900 border border-purple-300 font-bold',
  out_for_delivery: 'bg-blue-100 text-blue-900 border border-blue-300 font-bold',
  delivered: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
  cancelled: 'bg-rose-100 text-rose-900 border border-rose-300 font-bold',
};

const PLACEHOLDER = 'https://placehold.co/60x75/141414/888888?text=NX';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({});

  // ── Filters ──────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // newest | oldest
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCoupon, setFilterCoupon] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = listenToAllOrders(o => {
      setOrders(o);
      setLoading(false);
      
      // Update tracking inputs map if needed
      setTrackingInputs(p => {
        const next = { ...p };
        o.forEach(order => {
          if (next[order.id] === undefined) {
            next[order.id] = order.trackingId || '';
          }
        });
        return next;
      });
    });

    return () => unsubscribe();
  }, []);

  // ── Derived: unique coupon codes for dropdown ──
  const uniqueCoupons = [...new Set(orders.filter(o => o.couponCode).map(o => o.couponCode))];

  // ── Filtered + Sorted Orders ──────────────────
  const filteredOrders = orders
    .filter(o => {
      // Status filter
      if (filterStatus !== 'all' && (o.status?.toLowerCase() || 'confirmed') !== filterStatus) return false;
      
      // Coupon filter
      if (filterCoupon && o.couponCode !== filterCoupon) return false;
      
      // Date range filter
      if (filterDateFrom || filterDateTo) {
        const orderDate = o.createdAt?.toDate?.();
        if (!orderDate) return false;
        if (filterDateFrom && orderDate < new Date(filterDateFrom)) return false;
        if (filterDateTo) {
          const toEnd = new Date(filterDateTo);
          toEnd.setHours(23, 59, 59, 999);
          if (orderDate > toEnd) return false;
        }
      }

      // Search (name, email, phone, order ID)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (o.customerName || o.address?.name || '').toLowerCase();
        const email = (o.userEmail || o.address?.email || '').toLowerCase();
        const phone = (o.customerPhone || o.address?.phone || '').toLowerCase();
        const id = o.id.toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !id.includes(q)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

  const hasActiveFilters = filterStatus !== 'all' || filterCoupon || filterDateFrom || filterDateTo || searchQuery;

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterCoupon('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
    setSortOrder('newest');
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { auth } = await import('../../firebase/config');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: id,
          newStatus: status,
          trackingId: trackingInputs[id]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Status updated', { className: 'toast-vybera' });
    } catch (err) {
      toast.error(err.message, { className: 'toast-vybera' });
    }
  };

  const handleMessageCustomer = (order) => {
    const phone = order.customerPhone || order.address?.phone || '';
    if (!phone) {
      toast.error('No mobile number available for this customer', { className: 'toast-vybera' });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
    const msg = `Hello from VYBERA regarding your order.`;
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleTrackingSave = async (order) => {
    try {
      const { auth } = await import('../../firebase/config');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.id,
          newStatus: order.status,
          trackingId: trackingInputs[order.id]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, trackingId: trackingInputs[order.id] } : o));
      toast.success('Tracking ID saved', { className: 'toast-vybera' });
    } catch (err) {
      toast.error(err.message, { className: 'toast-vybera' });
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently delete order ${id}?`)) return;
    try {
      await deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      if (expanded === id) setExpanded(null);
      toast.success('Order deleted', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to delete order', { className: 'toast-vybera' });
    }
  };

  const startEditing = (order) => {
    setEditingOrder(order.id);
    setEditForm({
      customerName: order.customerName || order.address?.name || '',
      userEmail: order.userEmail || order.address?.email || '',
      customerPhone: order.customerPhone || order.address?.phone || '',
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      discount: order.discount || 0
    });
  };

  const handleEditSave = async (order) => {
    try {
      await updateOrderFull(order.id, {
        customerName: editForm.customerName,
        userEmail: editForm.userEmail,
        customerPhone: editForm.customerPhone,
        total: Number(editForm.total),
        subtotal: Number(editForm.subtotal),
        discount: Number(editForm.discount),
      });
      setEditingOrder(null);
      toast.success('Order details updated', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to update order', { className: 'toast-vybera' });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="mb-6">
        <div className="flex items-end justify-between mb-4 pb-4 border-b border-[#D4BEA5]">
          <div>
            <p className="text-[#75665C] text-xs font-semibold tracking-widest uppercase mb-1">Admin Panel</p>
            <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wider text-[#30231F]">
              Orders <span className="text-[#75665C] font-normal text-lg">({filteredOrders.length}{filteredOrders.length !== orders.length ? ` / ${orders.length}` : ''})</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-[#590907] text-xs font-semibold tracking-widest uppercase hover:underline transition-colors">
                <X size={12} /> Clear
              </button>
            )}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2 border text-xs font-semibold tracking-widest uppercase transition-all rounded-sm ${
                showFilters ? 'bg-[#590907] text-[#FAF5ED] border-[#590907]' : 'bg-[#FAF5ED] border-[#D4BEA5] text-[#30231F] hover:bg-[#E8D2B5]'
              }`}
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
          </div>
        </div>

        {/* ── Filter Panel ────────────────────── */}
        <motion.div
          initial={false}
          animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shadow-sm rounded-sm">
            {/* Search */}
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Search</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75665C]" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Name, email, order ID..."
                  className="vy-input pl-9 w-full text-xs"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="vy-input w-full text-xs"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Coupon */}
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Coupon Code</label>
              <select
                value={filterCoupon}
                onChange={e => setFilterCoupon(e.target.value)}
                className="vy-input w-full text-xs"
              >
                <option value="">All Orders</option>
                {uniqueCoupons.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Sort By</label>
              <button
                onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
                className="vy-input w-full text-xs flex items-center justify-between"
              >
                <span className="font-medium">{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                <ArrowUpDown size={14} className="text-[#75665C]" />
              </button>
            </div>

            {/* Date From */}
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="vy-input w-full text-xs"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="vy-input w-full text-xs"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Orders Table ────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] shadow-sm overflow-hidden rounded-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#D4BEA5] bg-[#FAF5ED]">
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Details'].map(h => (
                  <th key={h} className="text-[#75665C] text-xs tracking-widest uppercase text-left px-4 py-3.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <React.Fragment key={order.id}>
                  <tr
                    className="border-b border-[#D4BEA5] hover:bg-[#E8D2B5]/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-[#590907] text-xs font-mono font-bold">
                      #{order.id.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#30231F] text-xs font-bold">{order.customerName || order.address?.name || '—'}</p>
                      <p className="text-[#75665C] text-xs">{order.userEmail || order.address?.email || ''}</p>
                      {(order.customerPhone || order.address?.phone) && (
                        <p className="text-[#590907] text-[11px] font-mono font-semibold mt-0.5">📱 +91 {order.customerPhone || order.address?.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#30231F] text-xs font-medium">{order.products?.length || 0} item(s)</td>
                    <td className="px-4 py-3 text-[#590907] text-xs font-bold">₹{order.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status?.toLowerCase() || 'confirmed'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-sm border cursor-pointer outline-none ${statusClass[order.status?.toLowerCase()] || statusClass.confirmed}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-[#FAF5ED] text-[#30231F] font-semibold">{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[#75665C] text-xs font-medium">
                      <div className="text-[#30231F]">{order.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</div>
                      <div className="text-[10px] text-[#75665C]">{order.createdAt?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) || ''}</div>
                      {order.couponCode && (
                        <div className="text-[10px] text-emerald-800 font-bold mt-1 tracking-wider">🎟 {order.couponCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-[#590907] hover:text-[#430605] text-xs font-bold hover:underline transition-colors tracking-widest uppercase"
                      >
                        {expanded === order.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-detail`} className="border-b border-[#D4BEA5] bg-[#E8D2B5]/25">
                      <td colSpan={7} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Products */}
                          <div>
                            <h4 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4">Products</h4>
                            <div className="space-y-3">
                              {order.products?.map((p, i) => (
                                <div key={i} className="flex gap-3 items-start border-b border-[#D4BEA5] pb-3 last:border-0">
                                  <img src={p.image || PLACEHOLDER} alt={p.name} className="w-10 h-12 object-contain bg-white border border-[#D4BEA5]" />
                                  <div className="flex-1">
                                    <p className="text-[#30231F] text-xs font-bold">
                                      {p.isCustom && <span className="inline-block bg-[#590907] text-white text-[8px] font-bold px-1.5 py-0.5 mr-1 rounded-sm">CUSTOM</span>}
                                      {p.name}
                                    </p>
                                    <p className="text-[#75665C] text-xs font-medium">Size: {p.size} × {p.quantity}</p>
                                    {p.isCustom && (
                                      <div className="mt-1 space-y-1">
                                        <p className="text-[#590907] text-[10px] uppercase tracking-widest font-bold">Fit: {p.fit || 'Oversize'} | Position: {p.position}</p>
                                        {p.description && <p className="text-[#75665C] text-[10px] leading-relaxed italic">"{p.description}"</p>}
                                        {p.imageUrls && p.imageUrls.length > 0 && (
                                          <div className="flex gap-1.5 mt-2">
                                            {p.imageUrls.map((url, idx) => (
                                              <a key={idx} href={url} target="_blank" rel="noreferrer" className="w-9 h-9 border border-[#D4BEA5] hover:border-[#590907] transition-colors rounded-sm overflow-hidden">
                                                <img src={url} alt="Design" className="w-full h-full object-cover" />
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[#590907] text-xs font-bold">₹{(p.price * p.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Delivery & Contact */}
                          <div>
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[#75665C] text-xs font-bold tracking-widest uppercase">Customer Contact</h4>
                                {editingOrder === order.id ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => setEditingOrder(null)} className="text-[#75665C] text-xs hover:text-[#30231F] transition-colors font-semibold">Cancel</button>
                                    <button onClick={() => handleEditSave(order)} className="flex items-center gap-1 text-emerald-800 font-bold text-xs hover:underline transition-colors"><Save size={12}/> Save</button>
                                  </div>
                                ) : (
                                  <button onClick={() => startEditing(order)} className="flex items-center gap-1 text-[#590907] text-xs font-bold hover:underline transition-colors"><Edit3 size={12} /> Edit</button>
                                )}
                              </div>
                              <div className="space-y-1.5">
                                {editingOrder === order.id ? (
                                  <>
                                    <input value={editForm.customerName} onChange={e => setEditForm(p => ({...p, customerName: e.target.value}))} className="vy-input text-xs w-full mb-1" placeholder="Name" />
                                    <input value={editForm.userEmail} onChange={e => setEditForm(p => ({...p, userEmail: e.target.value}))} className="vy-input text-xs w-full mb-1" placeholder="Email" />
                                    <input value={editForm.customerPhone} onChange={e => setEditForm(p => ({...p, customerPhone: e.target.value}))} className="vy-input text-xs w-full mb-1" placeholder="Phone" />
                                  </>
                                ) : (
                                  <>
                                    <p className="text-[#30231F] text-xs font-medium"><span className="text-[#75665C] inline-block w-16">Name:</span> {order.customerName || order.address?.name}</p>
                                    <p className="text-[#30231F] text-xs font-medium"><span className="text-[#75665C] inline-block w-16">Email:</span> {order.userEmail || order.address?.email}</p>
                                    <p className="text-[#30231F] text-xs font-medium"><span className="text-[#75665C] inline-block w-16">Mobile:</span> {order.customerPhone || order.address?.phone}</p>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <h4 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4">Delivery Address</h4>
                            <div className="space-y-1.5">
                              {order.address && Object.entries(order.address).filter(([k]) => !['email', 'name', 'phone'].includes(k)).map(([k, v]) => (
                                <p key={k} className="text-[#30231F] text-xs capitalize font-medium"><span className="text-[#75665C] inline-block w-16">{k}:</span> {v}</p>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#D4BEA5] space-y-1">
                              {editingOrder === order.id ? (
                                <>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#75665C] font-medium">Subtotal</span>
                                    <input type="number" value={editForm.subtotal} onChange={e => setEditForm(p => ({...p, subtotal: e.target.value}))} className="vy-input text-xs w-24 text-right" />
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-emerald-800 font-medium">Coupon Discount</span>
                                    <input type="number" value={editForm.discount} onChange={e => setEditForm(p => ({...p, discount: e.target.value}))} className="vy-input text-xs w-24 text-right" />
                                  </div>
                                  <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-[#30231F]">Total</span>
                                    <input type="number" value={editForm.total} onChange={e => setEditForm(p => ({...p, total: e.target.value}))} className="vy-input text-xs w-24 text-right" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-[#75665C] font-medium">Subtotal</span>
                                    <span className="text-[#30231F] font-bold">₹{order.subtotal?.toLocaleString()}</span>
                                  </div>
                                  {order.discount > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-emerald-800 font-semibold">Coupon ({order.couponCode})</span>
                                      <span className="text-emerald-800 font-bold">−₹{order.discount?.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-[#30231F]">Total</span>
                                    <span className="text-[#590907] text-sm">₹{order.total?.toLocaleString()}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {order.paymentId && (
                              <p className="text-[#75665C] text-xs mt-3">Payment ID: <span className="font-mono text-[#590907] font-semibold">{order.paymentId}</span></p>
                            )}
                            
                            <button 
                              onClick={() => handleMessageCustomer(order)}
                              className="mt-6 w-full py-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold tracking-widest uppercase hover:bg-emerald-200 transition-all flex items-center justify-center gap-2 rounded-sm shadow-xs"
                            >
                              <MessageCircle size={15} /> Message on WhatsApp
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="mt-3 w-full py-2.5 bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold tracking-widest uppercase hover:bg-rose-200 transition-all flex items-center justify-center gap-2 rounded-sm"
                            >
                              <Trash2 size={15} /> Delete Order
                            </button>
                          </div>

                          {/* Tracking & Admin Controls */}
                          <div className="md:col-span-2 pt-4 border-t border-[#D4BEA5] mt-2">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Tracking */}
                              <div className="flex-1">
                                <h4 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4">Tracking Information</h4>
                                <div className="flex gap-4 items-center">
                                  <input 
                                    value={trackingInputs[order.id] || ''} 
                                    onChange={e => setTrackingInputs(p => ({...p, [order.id]: e.target.value}))}
                                    placeholder="Paste Courier Tracking ID" 
                                    className="vy-input flex-1 max-w-sm"
                                  />
                                  <button 
                                    onClick={() => handleTrackingSave(order)}
                                    className="btn-primary py-2 px-6 text-xs"
                                  >
                                    Save Tracking ID
                                  </button>
                                </div>
                              </div>
                              {/* Bill Downloads */}
                              <div>
                                <h4 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4">Download Bills</h4>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => printShippingLabel(order)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#FAF5ED] border border-[#D4BEA5] text-[#590907] font-semibold text-xs tracking-widest uppercase hover:bg-[#E8D2B5] transition-all rounded-sm shadow-xs"
                                  >
                                    <Package size={14} />
                                    Shipping Label
                                  </button>
                                  <button
                                    onClick={() => printOrderInvoice(order)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#FAF5ED] border border-[#D4BEA5] text-[#590907] font-semibold text-xs tracking-widest uppercase hover:bg-[#E8D2B5] transition-all rounded-sm shadow-xs"
                                  >
                                    <FileText size={14} />
                                    Invoice
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Return / Replace Request */}
                          {order.returnRequest && (
                            <div className="md:col-span-2 pt-4 border-t border-[#D4BEA5] mt-2">
                              <h4 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                                <RotateCcw size={14} className="text-[#590907]" />
                                {order.returnRequest.type === 'replace' ? 'Replacement' : 'Return'} Request
                                <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border rounded-xs ${
                                  order.returnRequest.status === 'approved' ? 'text-emerald-900 border-emerald-300 bg-emerald-100'
                                  : order.returnRequest.status === 'rejected' ? 'text-rose-900 border-rose-300 bg-rose-100'
                                  : 'text-amber-900 border-amber-300 bg-amber-100'
                                }`}>{order.returnRequest.status}</span>
                              </h4>
                              <div className="space-y-1.5 mb-4 text-xs font-medium">
                                <p className="text-[#75665C]">Reason: <span className="text-[#30231F] font-bold">{order.returnRequest.reason}</span></p>
                                {order.returnRequest.items && (
                                  <p className="text-[#75665C]">Items: <span className="text-[#30231F] font-bold">{order.returnRequest.items.join(', ')}</span></p>
                                )}
                                <p className="text-[#75665C]">Requested: <span className="text-[#30231F]">{new Date(order.returnRequest.requestedAt).toLocaleDateString('en-IN')}</span></p>
                              </div>
                              {order.returnRequest.status === 'pending' && (
                                <div className="flex gap-3">
                                  <button
                                    onClick={async () => {
                                      await updateReturnStatus(order.id, 'approved', 'Return approved by admin.');
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, returnRequest: { ...o.returnRequest, status: 'approved', adminNote: 'Return approved by admin.' } } : o));
                                      toast.success('Return approved', { className: 'toast-vybera' });
                                    }}
                                    className="px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold tracking-widest uppercase hover:bg-emerald-200 transition-all rounded-sm shadow-xs"
                                  >Approve</button>
                                  <button
                                    onClick={async () => {
                                      const note = prompt('Rejection reason (optional):') || 'Request rejected.';
                                      await updateReturnStatus(order.id, 'rejected', note);
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, returnRequest: { ...o.returnRequest, status: 'rejected', adminNote: note } } : o));
                                      toast.success('Return rejected', { className: 'toast-vybera' });
                                    }}
                                    className="px-4 py-2 bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold tracking-widest uppercase hover:bg-rose-200 transition-all rounded-sm"
                                  >Reject</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-16 text-[#75665C]">
              <p className="text-xs uppercase tracking-widest mb-3">
                {hasActiveFilters ? 'No orders match your filters' : 'No orders recorded yet'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="btn-secondary text-xs">Clear Filters</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
