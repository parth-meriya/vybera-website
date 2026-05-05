import { useEffect, useState } from 'react';
import { listenToAllOrders, updateOrderStatus, updateOrderTracking, updateReturnStatus } from '../../firebase/orders';
import { printShippingLabel, printOrderInvoice } from '../../utils/billGenerator';
import { motion } from 'framer-motion';
import { FileText, Package, RotateCcw, SlidersHorizontal, X, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const statusClass = {
  pending: 'text-vy-grey bg-vy-grey/10 border border-vy-grey/30',
  confirmed: 'text-vy-white bg-vy-white/10 border border-vy-white/30',
  processing: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30',
  shipped: 'text-blue-400 bg-blue-500/10 border border-blue-500/30',
  out_for_delivery: 'text-green-400 bg-green-500/10 border border-green-500/30',
  delivered: 'text-green-400 bg-green-500/10 border border-green-500/30',
  cancelled: 'text-red-400 bg-red-500/10 border border-red-500/30',
};

const PLACEHOLDER = 'https://placehold.co/60x75/141414/888888?text=NX';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

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

      // Search (name, email, order ID)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (o.address?.name || '').toLowerCase();
        const email = (o.userEmail || o.address?.email || '').toLowerCase();
        const id = o.id.toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !id.includes(q)) return false;
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
    await updateOrderTracking(id, status, trackingInputs[id]);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success('Status updated', { className: 'toast-vybera' });
  };

  const handleTrackingSave = async (order) => {
    await updateOrderTracking(order.id, order.status, trackingInputs[order.id]);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, trackingId: trackingInputs[order.id] } : o));
    toast.success('Tracking ID saved', { className: 'toast-vybera' });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
            <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">
              Orders <span className="text-vy-grey font-normal text-lg">({filteredOrders.length}{filteredOrders.length !== orders.length ? ` / ${orders.length}` : ''})</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors">
                <X size={12} /> Clear
              </button>
            )}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2 border text-xs tracking-widest uppercase transition-all ${
                showFilters ? 'bg-vy-white text-vy-black border-vy-white' : 'border-vy-border text-vy-grey hover:text-vy-white hover:border-vy-grey'
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
          <div className="bg-vy-card border border-vy-border p-6 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-vy-grey text-[10px] tracking-widest uppercase block mb-2">Search</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vy-grey" />
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
              <label className="text-vy-grey text-[10px] tracking-widest uppercase block mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="vy-input w-full text-xs bg-vy-dark"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Coupon */}
            <div>
              <label className="text-vy-grey text-[10px] tracking-widest uppercase block mb-2">Coupon Code</label>
              <select
                value={filterCoupon}
                onChange={e => setFilterCoupon(e.target.value)}
                className="vy-input w-full text-xs bg-vy-dark"
              >
                <option value="">All Orders</option>
                {uniqueCoupons.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-vy-grey text-[10px] tracking-widest uppercase block mb-2">Sort By</label>
              <button
                onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
                className="vy-input w-full text-xs flex items-center justify-between"
              >
                <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                <ArrowUpDown size={14} className="text-vy-grey" />
              </button>
            </div>

            {/* Date From */}
            <div>
              <label className="text-vy-grey text-[10px] tracking-widest uppercase block mb-2">From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="vy-input w-full text-xs bg-vy-dark"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-vy-grey text-[10px] tracking-widest uppercase block mb-2">To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="vy-input w-full text-xs bg-vy-dark"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-vy-card border border-vy-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vy-border">
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Details'].map(h => (
                  <th key={h} className="text-vy-grey text-xs tracking-widest uppercase text-left px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <>
                  <tr
                    key={order.id}
                    className="border-b border-vy-border/50 hover:bg-vy-border/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-vy-grey text-xs font-mono">{order.id.slice(0, 10)}...</td>
                    <td className="px-4 py-3">
                      <p className="text-vy-white text-xs font-medium">{order.address?.name || '—'}</p>
                      <p className="text-vy-grey text-xs">{order.userEmail || order.address?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-vy-grey text-xs">{order.products?.length || 0} item(s)</td>
                    <td className="px-4 py-3 text-vy-white text-xs font-semibold">₹{order.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status?.toLowerCase() || 'confirmed'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`text-[10px] uppercase tracking-widest bg-transparent border-0 outline-none cursor-pointer font-bold px-3 py-1.5 rounded-sm ${statusClass[order.status?.toLowerCase()] || statusClass.confirmed}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-vy-dark text-vy-white">{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-vy-grey text-xs">
                      <div>{order.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</div>
                      <div className="text-[10px] text-vy-border">{order.createdAt?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) || ''}</div>
                      {order.couponCode && (
                        <div className="text-[9px] text-green-400 mt-1 tracking-wider">🎟 {order.couponCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-vy-grey text-xs hover:text-vy-white transition-colors tracking-widest uppercase"
                      >
                        {expanded === order.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-detail`} className="border-b border-vy-border/50 bg-vy-black/20">
                      <td colSpan={7} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Products */}
                          <div>
                            <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-4">Products</h4>
                            <div className="space-y-3">
                              {order.products?.map((p, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                  <img src={p.image || PLACEHOLDER} alt={p.name} className="w-10 h-12 object-cover bg-vy-dark" />
                                  <div>
                                    <p className="text-vy-white text-xs font-medium">{p.name}</p>
                                    <p className="text-vy-grey text-xs">Size: {p.size} × {p.quantity}</p>
                                  </div>
                                  <span className="ml-auto text-vy-white text-xs font-semibold">₹{(p.price * p.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Delivery */}
                          <div>
                            <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-4">Delivery Address</h4>
                            <div className="space-y-1.5">
                              {order.address && Object.entries(order.address).filter(([k]) => k !== 'email').map(([k, v]) => (
                                <p key={k} className="text-vy-light text-xs">{v}</p>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-vy-border space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-vy-grey">Subtotal</span>
                                <span className="text-vy-white">₹{order.subtotal?.toLocaleString()}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-green-400">Coupon ({order.couponCode})</span>
                                  <span className="text-green-400">−₹{order.discount?.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-vy-white">Total</span>
                                <span className="text-vy-white">₹{order.total?.toLocaleString()}</span>
                              </div>
                            </div>
                            {order.paymentId && (
                              <p className="text-vy-grey text-xs mt-3">Payment ID: <span className="font-mono text-vy-light">{order.paymentId}</span></p>
                            )}
                          </div>

                          {/* Tracking & Admin Controls */}
                          <div className="md:col-span-2 pt-4 border-t border-vy-border mt-2">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Tracking */}
                              <div className="flex-1">
                                <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-4">Tracking Information</h4>
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
                                <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-4">Download Bills</h4>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => printShippingLabel(order)}
                                    className="flex items-center gap-2 px-4 py-2 bg-vy-border/30 border border-vy-border text-vy-light text-xs tracking-widest uppercase hover:bg-vy-border/60 hover:text-vy-white transition-all"
                                  >
                                    <Package size={14} />
                                    Shipping Label
                                  </button>
                                  <button
                                    onClick={() => printOrderInvoice(order)}
                                    className="flex items-center gap-2 px-4 py-2 bg-vy-border/30 border border-vy-border text-vy-light text-xs tracking-widest uppercase hover:bg-vy-border/60 hover:text-vy-white transition-all"
                                  >
                                    <FileText size={14} />
                                    Order Invoice
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Return / Replace Request */}
                          {order.returnRequest && (
                            <div className="md:col-span-2 pt-4 border-t border-vy-border mt-2">
                              <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                                <RotateCcw size={14} />
                                {order.returnRequest.type === 'replace' ? 'Replacement' : 'Return'} Request
                                <span className={`ml-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${
                                  order.returnRequest.status === 'approved' ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                  : order.returnRequest.status === 'rejected' ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                  : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                                }`}>{order.returnRequest.status}</span>
                              </h4>
                              <div className="space-y-2 mb-4">
                                <p className="text-vy-grey text-xs">Reason: <span className="text-vy-light">{order.returnRequest.reason}</span></p>
                                {order.returnRequest.items && (
                                  <p className="text-vy-grey text-xs">Items: <span className="text-vy-light">{order.returnRequest.items.join(', ')}</span></p>
                                )}
                                <p className="text-vy-grey text-xs">Requested: <span className="text-vy-light">{new Date(order.returnRequest.requestedAt).toLocaleDateString('en-IN')}</span></p>
                              </div>
                              {order.returnRequest.status === 'pending' && (
                                <div className="flex gap-3">
                                  <button
                                    onClick={async () => {
                                      await updateReturnStatus(order.id, 'approved', 'Return approved by admin.');
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, returnRequest: { ...o.returnRequest, status: 'approved', adminNote: 'Return approved by admin.' } } : o));
                                      toast.success('Return approved', { className: 'toast-vybera' });
                                    }}
                                    className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs tracking-widest uppercase hover:bg-green-500/30 transition-all"
                                  >Approve</button>
                                  <button
                                    onClick={async () => {
                                      const note = prompt('Rejection reason (optional):') || 'Request rejected.';
                                      await updateReturnStatus(order.id, 'rejected', note);
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, returnRequest: { ...o.returnRequest, status: 'rejected', adminNote: note } } : o));
                                      toast.success('Return rejected', { className: 'toast-vybera' });
                                    }}
                                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs tracking-widest uppercase hover:bg-red-500/30 transition-all"
                                  >Reject</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-vy-grey text-sm tracking-widest uppercase mb-3">
                {hasActiveFilters ? 'No orders match your filters' : 'No orders yet'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="btn-outline text-xs">Clear Filters</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
