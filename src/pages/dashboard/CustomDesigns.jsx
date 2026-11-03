import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Palette, ExternalLink, RefreshCw, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCustomOrdersByUser } from '../../firebase/customOrders';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const CustomDesigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const fetchedOrders = await getCustomOrdersByUser(user.uid);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to fetch custom designs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleReorder = (order) => {
    // Add custom product to cart
    addToCart({
      id: order.id,
      name: 'Custom Design Reorder',
      price: order.price || order.total,
      image: order.imageUrls?.[0] || 'https://placehold.co/400x500/141414/888888?text=Custom',
      size: order.size,
      quantity: 1,
      isCustom: true,
      selectedColor: order.color,
      customImages: order.imageUrls,
      customNotes: order.description,
      customPosition: order.position
    });
    
    toast.success('Custom design added to cart', { className: 'toast-vybera' });
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-2">My Custom Designs</h2>
        <p className="text-[#75665C] text-xs tracking-[0.2em] uppercase font-semibold">Manage and reorder your creations</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-12 text-center flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E8D2B5]/40 flex items-center justify-center mb-4">
            <Palette size={32} className="text-[#590907]" />
          </div>
          <p className="text-[#30231F] text-lg font-bold mb-2">No Custom Designs Yet</p>
          <p className="text-[#75665C] text-xs mb-6">Create your own unique premium oversized tee.</p>
          <Link to="/customize" className="btn-primary text-xs py-3 px-8 uppercase tracking-widest">
            Create Design
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-xl overflow-hidden shadow-sm">
              <div 
                className="p-6 flex flex-col md:flex-row gap-6 items-start cursor-pointer hover:bg-[#F3E7D8]/30 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                {/* Images Preview */}
                <div className="flex -space-x-4 w-full md:w-auto shrink-0 justify-center md:justify-start">
                  {order.imageUrls?.length > 0 ? (
                    order.imageUrls.map((url, i) => (
                      <div key={i} className="w-20 h-24 bg-white border-2 border-[#D4BEA5] rounded-lg overflow-hidden relative z-0 hover:z-10 transition-transform hover:scale-110 shadow-md">
                        <img src={url} alt="Design" className="w-full h-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="w-20 h-24 bg-white border-2 border-[#D4BEA5] rounded-lg flex items-center justify-center text-[10px] text-[#75665C] uppercase tracking-widest text-center px-1 font-bold">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-[#30231F] font-bold text-lg tracking-wider">Custom {order.color} Tee</h3>
                    <p className="text-[#75665C] text-xs uppercase tracking-widest font-semibold">
                      {order.position} Print · Size {order.size}
                    </p>
                    <p className="text-[#590907] font-bold font-mono text-base pt-1">₹{order.price?.toLocaleString()}</p>
                    <p className="text-[#75665C] text-[10px] uppercase tracking-widest pt-1 font-medium">
                      {order.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 justify-center items-center md:items-end w-full md:w-auto shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-[#75665C] font-bold">Status:</span>
                      {order.status === 'Completed' || order.status === 'Delivered' ? (
                        <span className="badge-delivered flex items-center gap-1.5">
                          <CheckCircle size={12} /> {order.status}
                        </span>
                      ) : (
                        <span className="badge-pending flex items-center gap-1.5">
                          <Clock size={12} /> {order.status || 'Processing'}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                      className="w-full md:w-auto px-6 py-2.5 btn-primary text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 mt-2 md:mt-0"
                    >
                      <RefreshCw size={14} /> Reorder Design
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Area */}
              <AnimatePresence>
                {expanded === order.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[#D4BEA5] bg-[#F3E7D8]/50 overflow-hidden"
                  >
                    <div className="p-6 md:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-[#75665C] text-[10px] uppercase tracking-widest mb-4 font-bold">Design Resources</h4>
                          {order.imageUrls?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              {order.imageUrls.map((url, i) => (
                                <div key={i} className="bg-white border border-[#D4BEA5] rounded-xl p-3 shadow-sm">
                                  <img src={url} alt="Design" className="w-full aspect-square object-contain mx-auto" />
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="mt-3 flex items-center justify-center gap-2 text-[#75665C] text-xs hover:text-[#590907] font-semibold transition-colors"
                                  >
                                    <ExternalLink size={12} /> View Full
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 border border-dashed border-[#D4BEA5] bg-white rounded-xl text-center text-[#75665C] text-xs font-medium">
                              No images were uploaded. Design was communicated via WhatsApp.
                            </div>
                          )}
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[#75665C] text-[10px] uppercase tracking-widest mb-3 font-bold">Order Details</h4>
                            <div className="space-y-2 text-xs bg-white border border-[#D4BEA5] rounded-xl p-4 shadow-sm">
                              <div className="flex justify-between border-b border-[#D4BEA5]/60 pb-2">
                                <span className="text-[#75665C] font-medium">Order ID</span>
                                <span className="text-[#590907] font-mono font-bold">{order.id}</span>
                              </div>
                              <div className="flex justify-between border-b border-[#D4BEA5]/60 pb-2">
                                <span className="text-[#75665C] font-medium">Placement</span>
                                <span className="text-[#30231F] font-bold capitalize">{order.position}</span>
                              </div>
                              <div className="flex justify-between border-b border-[#D4BEA5]/60 pb-2">
                                <span className="text-[#75665C] font-medium">Base Price</span>
                                <span className="text-[#30231F] font-mono font-semibold">₹{order.basePrice?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-b border-[#D4BEA5]/60 pb-2">
                                <span className="text-[#75665C] font-medium">Discount</span>
                                <span className="text-[#30231F] font-mono font-semibold">{order.discount > 0 ? `-₹${order.discount}` : '—'}</span>
                              </div>
                              <div className="flex justify-between pt-1">
                                <span className="text-[#30231F] font-bold">Total</span>
                                <span className="text-[#590907] font-bold font-mono text-sm">₹{order.price?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[#75665C] text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2 font-bold">
                              <AlertCircle size={12} className="text-[#590907]" /> Design Notes
                            </h4>
                            <div className="p-4 bg-white border border-[#D4BEA5] rounded-xl text-[#30231F] text-xs italic leading-relaxed shadow-sm">
                              {order.description || 'No special instructions provided.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default CustomDesigns;
