import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrderById, submitReturnRequest } from '../firebase/orders';
import { getCustomOrderById } from '../firebase/customOrders';
import { CheckCircle, ArrowLeft, Package, Truck, Home, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../components/ui/BackButton';

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
      <div className="min-h-screen bg-[#F3E7D8] pt-24 flex flex-col items-center justify-center">
        <div className="spinner mb-6" />
        <p className="text-[#75665C] text-xs tracking-widest uppercase font-bold">Locating Order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F3E7D8] pt-24 flex flex-col items-center justify-center gap-4">
        <p className="text-[#30231F] font-bold text-xl">Order Not Found</p>
        <Link to="/dashboard/orders" className="btn-primary">Return to Orders</Link>
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
    <div className="min-h-screen bg-[#F3E7D8] pt-24 pb-16">
      <div className="max-w-screen-md mx-auto px-6 md:px-12 py-12">
        <div className="mb-8">
          <BackButton />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-10">
            <h1 className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-2">
              Track Order
            </h1>
            <p className="text-[#590907] text-base font-mono font-bold tracking-wider">#{order.id}</p>
          </div>

          {isCancelled ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center mb-10 shadow-sm">
              <p className="text-rose-800 font-bold tracking-widest uppercase mb-2">Order Cancelled</p>
              <p className="text-rose-700 text-xs">This order has been cancelled and will not be delivered.</p>
            </div>
          ) : (
            <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 md:p-10 mb-10 overflow-hidden shadow-sm">
              <h2 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-10">Delivery Status</h2>
              
              <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                {/* Horizontal connection line (Desktop) */}
                <div className="hidden md:block absolute top-6 left-6 right-6 h-[2px] bg-[#D4BEA5]" />
                <div 
                  className="hidden md:block absolute top-6 left-6 h-[2px] bg-emerald-600 transition-all duration-700" 
                  style={{ width: `${(Math.max(0, currentStepIndex) / (STATUS_STAGES.length - 1)) * 100}%`, right: '1.5rem' }} 
                />

                {/* Vertical connection line (Mobile) */}
                <div className="md:hidden absolute top-6 bottom-6 left-[1.4rem] w-[2px] bg-[#D4BEA5]" />
                <div 
                  className="md:hidden absolute top-6 left-[1.4rem] w-[2px] bg-emerald-600 transition-all duration-700" 
                  style={{ height: `${(Math.max(0, currentStepIndex) / (STATUS_STAGES.length - 1)) * 100}%`, bottom: '1.5rem' }} 
                />

                {STATUS_STAGES.map((stage, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const Icon = stage.icon;
                  
                  return (
                    <div key={stage.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-3 group">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors duration-500
                        ${isCompleted ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-[#D4BEA5] text-[#75665C] bg-white'}
                        ${isCurrent && 'ring-4 ring-emerald-600/20 shadow-md'}
                      `}>
                        <Icon size={20} />
                      </div>
                      <div className="md:text-center">
                        <p className={`text-sm font-bold tracking-wider ${isCompleted ? 'text-[#30231F]' : 'text-[#75665C]'}`}>
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                            className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest mt-1 hidden md:block"
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
            <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 shadow-sm">
              <h3 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4">Order Details</h3>
              <div className="space-y-4">
                {order.products ? (
                  order.products.map((p, i) => (
                    <div key={i} className="flex gap-3">
                      <img src={p.image || 'https://placehold.co/60x75/FAF5ED/30231F?text=VY'} alt={p.name} className="w-12 h-16 object-cover rounded-lg border border-[#D4BEA5]" />
                      <div>
                        <p className="text-[#30231F] text-sm font-bold">{p.name}</p>
                        <p className="text-[#75665C] text-xs font-medium">
                          Size: {p.size}
                          {p.selectedColor && ` | Color: ${p.selectedColor}`}
                          {' '}× {p.quantity}
                        </p>
                        <p className="text-[#590907] text-xs font-bold font-mono mt-1">₹{(p.price * p.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-3">
                    <div className="flex gap-1">
                      {order.imageUrls?.map((url, i) => (
                        <img key={i} src={url} alt="Custom" className="w-12 h-16 object-cover rounded-lg border border-[#D4BEA5]" />
                      ))}
                    </div>
                    <div>
                      <p className="text-[#30231F] text-sm font-bold">Custom Design Tee</p>
                      <p className="text-[#75665C] text-xs font-medium">Size: {order.size} | Color: {order.color}</p>
                      <p className="text-[#590907] text-xs font-bold font-mono mt-1">₹{order.total?.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-[#D4BEA5] flex justify-between items-center">
                  <span className="text-[#75665C] text-sm font-semibold">Total Paid</span>
                  <span className="text-[#590907] font-black font-mono text-xl">₹{order.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {order.trackingId && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-blue-900 text-xs font-bold tracking-widest uppercase mb-2">Tracking ID</h3>
                  <p className="text-[#590907] font-mono font-bold text-lg">{order.trackingId}</p>
                  <p className="text-blue-800 text-xs mt-2 font-medium">Use this ID on the courier partner's website to track exact location.</p>
                </div>
              )}

              <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 shadow-sm">
                <h3 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4">Delivery Address</h3>
                {order.address ? (
                  <div className="space-y-1">
                    <p className="text-[#30231F] text-sm font-bold">{order.address.name}</p>
                    <p className="text-[#75665C] text-sm font-medium">{order.address.address}</p>
                    <p className="text-[#75665C] text-sm font-medium">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                    <p className="text-[#75665C] text-sm mt-2 font-medium">{order.address.phone}</p>
                  </div>
                ) : (
                  <p className="text-[#75665C] text-sm font-medium">Address details not available.</p>
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
              const statusColor = rs.status === 'approved' ? 'text-emerald-800 border-emerald-300 bg-emerald-50'
                : rs.status === 'rejected' ? 'text-rose-800 border-rose-300 bg-rose-50'
                : 'text-amber-800 border-amber-300 bg-amber-50';
              
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 shadow-sm">
                  <h3 className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                    <RotateCcw size={14} className="text-[#590907]" /> {rs.type === 'replace' ? 'Replacement' : 'Return'} Request
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[#75665C] text-xs font-semibold">Status:</span>
                      <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border rounded ${statusColor}`}>
                        {rs.status}
                      </span>
                    </div>
                    <p className="text-[#75665C] text-xs">Reason: <span className="text-[#30231F] font-semibold">{rs.reason}</span></p>
                    {rs.adminNote && (
                      <p className="text-[#75665C] text-xs">Admin Note: <span className="text-[#30231F] font-semibold">{rs.adminNote}</span></p>
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
                    className="flex items-center gap-2 px-6 py-3 border border-[#D4BEA5] bg-[#FAF5ED] text-[#30231F] text-xs tracking-widest uppercase font-bold hover:bg-[#F3E7D8] rounded-xl transition-all shadow-sm"
                  >
                    <RotateCcw size={14} className="text-[#590907]" /> Request Return / Replace
                  </button>
                ) : (
                  <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[#30231F] text-sm font-bold tracking-widest uppercase mb-1">Request Return / Replace</h3>
                    <p className="text-[#75665C] text-xs tracking-wider mb-6">Only Limited Drop items are eligible for return/replacement.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-3">Type</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setReturnType('return')}
                            className={`px-5 py-2.5 text-xs font-bold tracking-widest uppercase rounded-lg border transition-all ${
                              returnType === 'return' ? 'bg-[#590907] text-white border-[#590907]' : 'border-[#D4BEA5] bg-white text-[#30231F] hover:bg-[#F3E7D8]/40'
                            }`}
                          >Return</button>
                          <button
                            onClick={() => setReturnType('replace')}
                            className={`px-5 py-2.5 text-xs font-bold tracking-widest uppercase rounded-lg border transition-all ${
                              returnType === 'replace' ? 'bg-[#590907] text-white border-[#590907]' : 'border-[#D4BEA5] bg-white text-[#30231F] hover:bg-[#F3E7D8]/40'
                            }`}
                          >Replace</button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[#75665C] text-xs font-bold tracking-widest uppercase mb-3">Reason</p>
                        <textarea
                          value={returnReason}
                          onChange={e => setReturnReason(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg p-3 text-sm focus:outline-none focus:border-[#590907]"
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
                          className="btn-primary py-2.5 px-6 text-xs uppercase tracking-widest"
                        >
                          {submittingReturn ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button
                          onClick={() => { setShowReturnForm(false); setReturnReason(''); }}
                          className="border border-[#D4BEA5] bg-white text-[#30231F] rounded-lg py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-[#F3E7D8]/40"
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
