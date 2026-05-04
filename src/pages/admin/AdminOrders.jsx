import { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, updateOrderTracking, updateReturnStatus } from '../../firebase/orders';
import { printShippingLabel, printOrderInvoice } from '../../utils/billGenerator';
import { motion } from 'framer-motion';
import { FileText, Package, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const statusClass = {
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

  useEffect(() => {
    getAllOrders().then(o => { 
      setOrders(o); 
      setLoading(false);
      const t = {};
      o.forEach(order => { t[order.id] = order.trackingId || ''; });
      setTrackingInputs(t);
    });
  }, []);

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
      <div className="mb-8">
        <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Orders ({orders.length})</h1>
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
              {orders.map(order => (
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
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
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
          {orders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-vy-grey text-sm tracking-widest uppercase">No orders yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
