import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { getAllCustomOrders, updateCustomOrderStatus } from '../../firebase/customOrders';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Completed', 'Cancelled'];

const statusClass = {
  Pending:    'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  Processing: 'text-blue-400  border-blue-500/30  bg-blue-500/10',
  Completed:  'text-green-400 border-green-500/30 bg-green-500/10',
  Cancelled:  'text-red-400   border-red-500/30   bg-red-500/10',
};

const AdminCustomOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getAllCustomOrders().then(o => { setOrders(o); setLoading(false); });
  }, []);

  const handleStatusChange = async (id, status) => {
    await updateCustomOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
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
      <div className="mb-8">
        <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">
          Custom Orders
        </h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Total',      counts.total,      'text-vy-white'],
          ['Pending',    counts.pending,     'text-yellow-400'],
          ['Processing', counts.processing,  'text-blue-400'],
          ['Completed',  counts.completed,   'text-green-400'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-vy-card border border-vy-border p-5">
            <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">{label}</p>
            <p className={`font-display font-bold text-2xl ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-vy-card border border-vy-border overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-vy-border">
                {['Preview', 'Customer', 'Spec', 'Price', 'Payment ID', 'Status', 'Date', 'Details'].map(h => (
                  <th key={h} className="text-vy-grey text-xs tracking-widest uppercase text-left px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <>
                  <tr key={order.id} className="border-b border-vy-border/50 hover:bg-vy-border/20 transition-colors">
                    {/* Design preview */}
                    <td className="px-4 py-3">
                      {order.imageUrls?.length > 0 ? (
                        <div className="flex -space-x-4">
                          {order.imageUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" title="View full image">
                              <div className="relative group w-12 h-14 z-0 hover:z-10 bg-vy-dark border border-vy-border">
                                <img src={url} alt="Design" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink size={10} className="text-white" />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="w-12 h-14 bg-vy-dark border border-vy-border flex items-center justify-center text-[10px] text-vy-grey">No img</div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-vy-white text-xs font-medium">{order.userName || '—'}</p>
                      <p className="text-vy-grey text-xs">{order.userEmail}</p>
                    </td>

                    {/* Spec */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-vy-white text-xs">{order.position} print</p>
                        <p className="text-vy-grey text-xs">{order.color} · {order.size}</p>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="text-vy-white text-xs font-semibold">₹{order.price?.toLocaleString()}</p>
                      {order.discount > 0 && (
                        <p className="text-green-400 text-xs">−₹{order.discount}</p>
                      )}
                    </td>

                    {/* Payment ID */}
                    <td className="px-4 py-3">
                      <span className="text-vy-grey text-xs font-mono">
                        {order.paymentId ? order.paymentId.slice(0, 14) + '…' : '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={order.status || 'Pending'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs bg-transparent border rounded px-2 py-0.5 outline-none cursor-pointer font-medium ${statusClass[order.status] || statusClass.Pending}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-vy-dark text-vy-white">{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-vy-grey text-xs">
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
                    </td>

                    {/* Expand */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-vy-grey hover:text-vy-white transition-colors"
                      >
                        {expanded === order.id
                          ? <ChevronUp size={14} />
                          : <ChevronDown size={14} />
                        }
                      </button>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {expanded === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={8} className="border-b border-vy-border/50 bg-vy-black/20">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-8 py-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                  <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-3">Uploaded Designs</h4>
                                  {order.imageUrls?.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                      {order.imageUrls.map((url, i) => (
                                        <div key={i} className="bg-vy-dark border border-vy-border p-3">
                                          <img src={url} alt="Design" className="max-w-full max-h-48 object-contain mx-auto" />
                                          <div className="mt-3 text-center">
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-vy-grey text-xs hover:text-vy-white transition-colors">
                                              <ExternalLink size={11} /> View HD
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : <p className="text-vy-grey text-xs">No images uploaded</p>}
                                </div>

                              {/* Order Details */}
                              <div>
                                <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-3">Order Details</h4>
                                <div className="space-y-2">
                                  {[
                                    ['Print Position', order.position],
                                    ['Color', order.color],
                                    ['Size', order.size],
                                    ['Base Price', `₹${order.basePrice}`],
                                    ['Discount', order.discount > 0 ? `−₹${order.discount} (${order.couponCode})` : 'None'],
                                    ['Total Paid', `₹${order.price}`],
                                  ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs">
                                      <span className="text-vy-grey">{k}</span>
                                      <span className="text-vy-white font-medium">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Design Notes & Payment */}
                              <div>
                                <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-3">Design Notes</h4>
                                <div className="bg-vy-dark border border-vy-border p-3 min-h-20 mb-4">
                                  <p className="text-vy-light text-xs leading-relaxed">
                                    {order.description || <span className="text-vy-border italic">No notes provided</span>}
                                  </p>
                                </div>

                                <h4 className="text-vy-grey text-xs tracking-widest uppercase mb-2">Payment</h4>
                                <p className="text-vy-grey text-xs font-mono break-all">{order.paymentId || '—'}</p>
                                {order.razorpayOrderId && (
                                  <p className="text-vy-border text-xs font-mono mt-1 break-all">{order.razorpayOrderId}</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-vy-grey text-sm tracking-widest uppercase">No custom orders yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCustomOrders;
