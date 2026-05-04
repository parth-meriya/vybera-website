import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrderById, submitReturnRequest } from '../firebase/orders';
import { getCustomOrderById } from '../firebase/customOrders';
import { CheckCircle, ArrowLeft, Package, Truck, Home, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STAGES = [
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
];

const TrackOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnType, setReturnType] = useState('return');
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Try regular orders first
        let o = await getOrderById(id);
        if (!o) {
          // If not found, try custom orders
          o = await getCustomOrderById(id);
        }
        
        if (o) setOrder(o);
        else toast.error('Order not found', { className: 'toast-vybera' });
      } catch (err) {
        toast.error('Failed to load tracking data', { className: 'toast-vybera' });
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex flex-col items-center justify-center">
        <div className="spinner mb-6" />
        <p className="text-vy-grey text-xs tracking-widest uppercase">Locating Order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex flex-col items-center justify-center gap-4">
        <p className="text-vy-white font-semibold text-xl">Order Not Found</p>
        <Link to="/my-orders" className="btn-outline">Return to My Orders</Link>
      </div>
    );
  }

  // Determine current step index
  const currentStatus = order.status?.toLowerCase() || 'confirmed';
  let currentStepIndex = STATUS_STAGES.findIndex(s => s.id === currentStatus);
  
  // If cancelled, we don't follow the normal timeline
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'rejected';

  // Fallback for custom orders which might have 'approved' instead of 'shipped' etc.
  if (currentStepIndex === -1 && !isCancelled) {
    if (currentStatus === 'pending') currentStepIndex = 0;
    else if (currentStatus === 'approved') currentStepIndex = 1;
    else currentStepIndex = 0;
  }

  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <div className="max-w-screen-md mx-auto px-6 md:px-12 py-12">
        <Link to="/my-orders" className="inline-flex items-center gap-2 text-vy-grey hover:text-vy-white transition-colors mb-8 text-xs tracking-widest uppercase font-semibold">
          <ArrowLeft size={14} /> Back to Orders
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-10">
            <h1 className="font-display font-bold text-3xl tracking-wider text-vy-white mb-2">
              Track Order
            </h1>
            <p className="text-vy-grey text-sm font-mono tracking-wider">#{order.id}</p>
          </div>

          {isCancelled ? (
            <div className="bg-red-500/10 border border-red-500/30 p-8 text-center mb-10">
              <p className="text-red-400 font-bold tracking-widest uppercase mb-2">Order Cancelled</p>
              <p className="text-red-400/70 text-xs">This order has been cancelled and will not be delivered.</p>
            </div>
          ) : (
            <div className="bg-vy-card border border-vy-border p-6 md:p-10 mb-10 overflow-hidden">
              <h2 className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-10">Delivery Status</h2>
              
              <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                {/* Horizontal connection line (Desktop) */}
                <div className="hidden md:block absolute top-6 left-6 right-6 h-[2px] bg-vy-border" />
                <div 
                  className="hidden md:block absolute top-6 left-6 h-[2px] bg-green-400 transition-all duration-700" 
                  style={{ width: `${(Math.max(0, currentStepIndex) / (STATUS_STAGES.length - 1)) * 100}%`, right: '1.5rem' }} 
                />

                {/* Vertical connection line (Mobile) */}
                <div className="md:hidden absolute top-6 bottom-6 left-[1.4rem] w-[2px] bg-vy-border" />
                <div 
                  className="md:hidden absolute top-6 left-[1.4rem] w-[2px] bg-green-400 transition-all duration-700" 
                  style={{ height: `${(Math.max(0, currentStepIndex) / (STATUS_STAGES.length - 1)) * 100}%`, bottom: '1.5rem' }} 
                />

                {STATUS_STAGES.map((stage, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const Icon = stage.icon;
                  
                  return (
                    <div key={stage.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-3 group">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors duration-500 bg-vy-card
                        ${isCompleted ? 'border-green-400 text-green-400' : 'border-vy-border text-vy-border'}
                        ${isCurrent && 'shadow-[0_0_15px_rgba(74,222,128,0.3)]'}
                      `}>
                        <Icon size={20} />
                      </div>
                      <div className="md:text-center">
                        <p className={`text-sm font-semibold tracking-wider ${isCompleted ? 'text-vy-white' : 'text-vy-grey'}`}>
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                            className="text-green-400 text-[10px] uppercase tracking-widest mt-1 hidden md:block"
                          >
                            Current
                          </motion.p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-vy-card border border-vy-border p-6">
              <h3 className="text-vy-grey text-xs tracking-widest uppercase mb-4">Order Details</h3>
              <div className="space-y-4">
                {order.products ? (
                  order.products.map((p, i) => (
                    <div key={i} className="flex gap-3">
                      <img src={p.image || 'https://placehold.co/60x75/141414/888888?text=VY'} alt={p.name} className="w-12 h-16 object-cover bg-vy-dark" />
                      <div>
                        <p className="text-vy-white text-sm font-medium">{p.name}</p>
                        <p className="text-vy-grey text-xs">Size: {p.size} × {p.quantity}</p>
                        <p className="text-vy-white text-xs font-semibold mt-1">₹{(p.price * p.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-3">
                    <div className="flex gap-1">
                      {order.imageUrls?.map((url, i) => (
                        <img key={i} src={url} alt="Custom" className="w-12 h-16 object-cover bg-vy-dark" />
                      ))}
                    </div>
                    <div>
                      <p className="text-vy-white text-sm font-medium">Custom Design Tee</p>
                      <p className="text-vy-grey text-xs">Size: {order.size} | Color: {order.color}</p>
                      <p className="text-vy-white text-xs font-semibold mt-1">₹{order.total?.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-vy-border flex justify-between">
                  <span className="text-vy-grey text-sm">Total Paid</span>
                  <span className="text-vy-white font-bold text-lg">₹{order.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {order.trackingId && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-6">
                  <h3 className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">Tracking ID</h3>
                  <p className="text-vy-white font-mono text-lg">{order.trackingId}</p>
                  <p className="text-blue-400/70 text-xs mt-2">Use this ID on the courier partner's website to track exact location.</p>
                </div>
              )}

              <div className="bg-vy-card border border-vy-border p-6">
                <h3 className="text-vy-grey text-xs tracking-widest uppercase mb-4">Delivery Address</h3>
                {order.address ? (
                  <div className="space-y-1">
                    <p className="text-vy-white text-sm font-medium">{order.address.name}</p>
                    <p className="text-vy-grey text-sm">{order.address.address}</p>
                    <p className="text-vy-grey text-sm">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                    <p className="text-vy-grey text-sm mt-2">{order.address.phone}</p>
                  </div>
                ) : (
                  <p className="text-vy-grey text-sm">Address details not available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Return / Replace Section */}
          {(() => {
            // Only show for regular orders (not custom)
            if (!order.products) return null;
            
            // Check if order has returnable products (isDrop only)
            const hasReturnableItems = order.products?.some(p => p.isDrop === true);
            if (!hasReturnableItems) return null;

            // Only show for delivered orders
            const status = order.status?.toLowerCase();
            if (status !== 'delivered') return null;

            // Already has a return request
            if (order.returnRequest) {
              const rs = order.returnRequest;
              const statusColor = rs.status === 'approved' ? 'text-green-400 border-green-500/30 bg-green-500/10'
                : rs.status === 'rejected' ? 'text-red-400 border-red-500/30 bg-red-500/10'
                : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
              
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-vy-card border border-vy-border p-6">
                  <h3 className="text-vy-grey text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                    <RotateCcw size={14} /> {rs.type === 'replace' ? 'Replacement' : 'Return'} Request
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-vy-grey text-xs">Status:</span>
                      <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
                        {rs.status}
                      </span>
                    </div>
                    <p className="text-vy-grey text-xs">Reason: <span className="text-vy-light">{rs.reason}</span></p>
                    {rs.adminNote && (
                      <p className="text-vy-grey text-xs">Admin Note: <span className="text-vy-light">{rs.adminNote}</span></p>
                    )}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                {!showReturnForm ? (
                  <button
                    onClick={() => setShowReturnForm(true)}
                    className="flex items-center gap-2 px-5 py-3 border border-vy-border text-vy-grey text-xs tracking-widest uppercase hover:bg-vy-card hover:text-vy-white transition-all"
                  >
                    <RotateCcw size={14} /> Request Return / Replace
                  </button>
                ) : (
                  <div className="bg-vy-card border border-vy-border p-6">
                    <h3 className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-1">Request Return / Replace</h3>
                    <p className="text-vy-grey text-[10px] tracking-wider mb-6">Only Limited Drop items are eligible for return/replacement.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-vy-grey text-xs tracking-widest uppercase mb-3">Type</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setReturnType('return')}
                            className={`px-4 py-2 text-xs tracking-widest uppercase border transition-all ${
                              returnType === 'return' ? 'bg-vy-white text-vy-black border-vy-white' : 'border-vy-border text-vy-grey hover:border-vy-grey'
                            }`}
                          >Return</button>
                          <button
                            onClick={() => setReturnType('replace')}
                            className={`px-4 py-2 text-xs tracking-widest uppercase border transition-all ${
                              returnType === 'replace' ? 'bg-vy-white text-vy-black border-vy-white' : 'border-vy-border text-vy-grey hover:border-vy-grey'
                            }`}
                          >Replace</button>
                        </div>
                      </div>

                      <div>
                        <p className="text-vy-grey text-xs tracking-widest uppercase mb-3">Reason</p>
                        <textarea
                          value={returnReason}
                          onChange={e => setReturnReason(e.target.value)}
                          rows={3}
                          className="vy-input resize-none w-full"
                          placeholder="Why do you want to return or replace this order?"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          disabled={submittingReturn || !returnReason.trim()}
                          onClick={async () => {
                            setSubmittingReturn(true);
                            try {
                              await submitReturnRequest(order.id, {
                                type: returnType,
                                reason: returnReason.trim(),
                                items: order.products.filter(p => p.isDrop).map(p => p.name),
                              });
                              setOrder(prev => ({
                                ...prev,
                                returnRequest: { type: returnType, reason: returnReason.trim(), status: 'pending', requestedAt: new Date().toISOString() },
                              }));
                              setShowReturnForm(false);
                              toast.success('Return request submitted!', { className: 'toast-vybera' });
                            } catch {
                              toast.error('Failed to submit request.', { className: 'toast-vybera' });
                            } finally {
                              setSubmittingReturn(false);
                            }
                          }}
                          className="btn-primary py-2 px-6 text-xs"
                        >
                          {submittingReturn ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button
                          onClick={() => { setShowReturnForm(false); setReturnReason(''); }}
                          className="btn-outline py-2 px-6 text-xs"
                        >Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </motion.div>
      </div>
    </div>
  );
};

export default TrackOrder;
