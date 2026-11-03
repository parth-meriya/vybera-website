import React, { useEffect, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCustomOrders, updateCustomOrderStatus, updateCustomDesignStatus } from '../../firebase/customOrders';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Check, Clock, MessageSquare, ExternalLink, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Completed', 'Cancelled'];

const statusClass = {
  Pending:    'badge-pending',
  Processing: 'badge-processing',
  Completed:  'badge-delivered',
  Cancelled:  'badge-cancelled',
};

const AdminCustomOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch from dedicated customOrders collection
      const customOrdersDirect = await getAllCustomOrders();

      // 2. Fetch from orders collection — extract products with isCustom: true
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        const fromOrders = [];
        ordersSnap.docs.forEach(doc => {
          const data = doc.data();
          const customProducts = (data.products || []).filter(p => p.isCustom);
          customProducts.forEach((p, idx) => {
            fromOrders.push({
              id: `${doc.id}_${idx}`,
              orderId: doc.id,
              source: 'orders',
              // Customer info
              userName: data.customerName || data.address?.name || '—',
              userEmail: data.userEmail || data.address?.email || '',
              customerPhone: data.customerPhone || data.address?.phone || '',
              // Product spec
              productName: p.name || 'Custom T-Shirt',
              position: p.position || '—',
              color: p.selectedColor || '—',
              size: p.size || '—',
              fit: p.fit || '—',
              // Images & design
              imageUrls: p.imageUrls || [],
              description: p.description || '',
              designStatus: p.designStatus || 'Received',
              // Pricing
              price: p.price || 0,
              basePrice: p.price || 0,
              discount: data.discount || 0,
              couponCode: data.couponCode || null,
              // Payment
              paymentId: data.paymentId || null,
              razorpayOrderId: data.razorpayOrderId || null,
              // Status — map from order status
              status: data.status === 'delivered' ? 'Completed' 
                    : data.status === 'cancelled' ? 'Cancelled'
                    : data.status === 'confirmed' || data.status === 'processing' || data.status === 'shipped' ? 'Processing'
                    : 'Pending',
              orderStatus: data.status,
              // Date
              createdAt: data.createdAt || null,
            });
          });
        });

        // 3. Merge — deduplicate by orderId (prefer customOrders collection entries)
        const directOrderIds = new Set(customOrdersDirect.map(o => o.orderId).filter(Boolean));
        const uniqueFromOrders = fromOrders.filter(o => !directOrderIds.has(o.orderId));

        const merged = [...customOrdersDirect, ...uniqueFromOrders].sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bTime - aTime;
        });

        setOrders(merged);
      } catch (err) {
        console.error('Failed to fetch custom orders:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleStatusChange = async (id, status) => {
    await updateCustomOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleDesignStatusChange = async (id, designStatus) => {
    await updateCustomDesignStatus(id, designStatus);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, designStatus } : o));
  };

  const counts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    completed: orders.filter(o => o.status === 'Completed').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between border-b border-[#D4BEA5] pb-4">
        <div>
          <p className="text-[#75665C] text-xs tracking-widest uppercase mb-1">Admin Panel</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-[#30231F]">
            Custom Orders
          </h1>
        </div>
        <button
          type="button"
          onClick={fetchAll}
          disabled={refreshing}
          title="Synchronize live custom orders"
          className="flex items-center gap-2 px-3.5 py-2 border text-xs font-semibold tracking-widest uppercase bg-[#FAF5ED] border-[#D4BEA5] text-[#30231F] hover:bg-[#E8D2B5] transition-all rounded-sm shadow-xs disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#590907]' : 'text-[#75665C]'} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Total',      counts.total,      'text-[#30231F]'],
          ['Pending',    counts.pending,     'text-amber-800'],
          ['Processing', counts.processing,  'text-blue-800'],
          ['Completed',  counts.completed,   'text-emerald-800'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-sm">
            <p className="text-[#75665C] text-xs tracking-widest uppercase mb-1">{label}</p>
            <p className={`font-display font-bold text-2xl ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#D4BEA5] bg-[#FAF5ED]">
                {['Preview', 'Customer', 'Spec', 'Price', 'Design', 'Status', 'Date', 'Details'].map(h => (
                  <th key={h} className="text-[#75665C] text-xs tracking-widest uppercase text-left px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-[#D4BEA5] hover:bg-[#F3E7D8]/60 transition-colors">
                    {/* Design preview */}
                    <td className="px-4 py-3">
                      {order.imageUrls?.length > 0 ? (
                        <div className="flex -space-x-4">
                          {order.imageUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" title="View full image">
                              <div className="relative group w-12 h-14 z-0 hover:z-10 bg-[#FAF5ED] border border-[#D4BEA5]">
                                <img src={url} alt="Design" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink size={10} className="text-white" />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="w-12 h-14 bg-[#F3E7D8] border border-[#D4BEA5] flex items-center justify-center text-[10px] text-[#75665C]">No img</div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-[#30231F] text-xs font-bold">{order.customerName || order.userName || '—'}</p>
                      <p className="text-[#75665C] text-xs">{order.userEmail}</p>
                      {order.source === 'orders' && order.orderStatus && (
                        <p className="text-[#590907] text-[9px] uppercase tracking-widest mt-1 font-semibold">via checkout • {order.orderStatus}</p>
                      )}
                    </td>

                    {/* Spec */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[#30231F] text-xs font-medium">{order.position} print</p>
                        <p className="text-[#75665C] text-xs">{order.color} · {order.size}</p>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="text-[#590907] text-xs font-bold font-mono">₹{order.price?.toLocaleString()}</p>
                      {order.discount > 0 && (
                        <p className="text-emerald-700 text-xs font-mono">−₹{order.discount}</p>
                      )}
                    </td>

                    {/* Design Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {order.designStatus === 'Received' ? (
                          <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider w-fit">
                            <Check size={12} /> Received
                          </div>
                        ) : order.designStatus === 'WhatsApp' ? (
                          <div className="inline-flex items-center gap-1.5 text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider w-fit">
                            <MessageSquare size={12} /> WhatsApp
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider w-fit">
                            <Clock size={12} /> Pending
                          </div>
                        )}
                        {order.designStatus !== 'Received' && (
                          <button
                            onClick={() => handleDesignStatusChange(order.id, 'Received')}
                            className="text-[#590907] hover:underline text-[9px] uppercase tracking-widest font-bold text-left"
                          >
                            Mark Received
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={order.status || 'Pending'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs border rounded px-2.5 py-1 outline-none cursor-pointer font-bold ${statusClass[order.status] || statusClass.Pending}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-[#FAF5ED] text-[#30231F]">{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[#75665C] text-xs">
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
                    </td>

                    {/* Expand */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-[#75665C] hover:text-[#590907] transition-colors p-1"
                      >
                        {expanded === order.id
                          ? <ChevronUp size={16} />
                          : <ChevronDown size={16} />
                        }
                      </button>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {expanded === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={8} className="border-b border-[#D4BEA5] bg-[#F3E7D8]/70">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-8 py-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                  <h4 className="text-[#75665C] text-xs tracking-widest uppercase font-semibold mb-3">Uploaded Designs</h4>
                                  {order.imageUrls?.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                      {order.imageUrls.map((url, i) => (
                                        <div key={i} className="bg-[#FAF5ED] border border-[#D4BEA5] p-3 shadow-sm">
                                          <img src={url} alt="Design" className="max-w-full max-h-48 object-contain mx-auto" />
                                          <div className="mt-3 text-center">
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#590907] text-xs hover:underline font-semibold">
                                              <ExternalLink size={11} /> View HD
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : <p className="text-[#75665C] text-xs">No images uploaded</p>}
                                </div>

                              {/* Order Details */}
                              <div>
                                <h4 className="text-[#75665C] text-xs tracking-widest uppercase font-semibold mb-3">Order Details</h4>
                                <div className="space-y-2 bg-[#FAF5ED] border border-[#D4BEA5] p-4 shadow-sm">
                                  {[
                                    ['Print Position', order.position],
                                    ['Color', order.color],
                                    ['Size', order.size],
                                    ['Base Price', `₹${order.basePrice}`],
                                    ['Discount', order.discount > 0 ? `−₹${order.discount} (${order.couponCode})` : 'None'],
                                    ['Total Paid', `₹${order.price}`],
                                  ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs py-1 border-b border-[#D4BEA5]/40 last:border-0">
                                      <span className="text-[#75665C]">{k}</span>
                                      <span className="text-[#30231F] font-bold">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Design Notes & Payment */}
                              <div>
                                <h4 className="text-[#75665C] text-xs tracking-widest uppercase font-semibold mb-3">Design Notes</h4>
                                <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-3 min-h-20 mb-4 shadow-sm">
                                  <p className="text-[#30231F] text-xs leading-relaxed">
                                    {order.description || <span className="text-[#75665C] italic">No notes provided</span>}
                                  </p>
                                </div>

                                <h4 className="text-[#75665C] text-xs tracking-widest uppercase font-semibold mb-2">Payment</h4>
                                <p className="text-[#75665C] text-xs font-mono break-all">{order.paymentId || '—'}</p>
                                {order.razorpayOrderId && (
                                  <p className="text-[#590907] text-xs font-mono mt-1 break-all font-semibold">{order.razorpayOrderId}</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#75665C] text-sm tracking-widest uppercase">No custom orders yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCustomOrders;
