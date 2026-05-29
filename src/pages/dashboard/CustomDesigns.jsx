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
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2">My Custom Designs</h2>
        <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Manage and reorder your creations</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-vy-card border border-vy-border p-12 text-center flex flex-col items-center">
          <Palette size={48} className="text-vy-border mb-4" />
          <p className="text-vy-white text-lg font-bold mb-2">No Custom Designs Yet</p>
          <p className="text-vy-grey text-xs mb-6">Create your own unique premium oversized tee.</p>
          <Link to="/customize" className="btn-primary text-xs py-3 px-8 uppercase tracking-widest">
            Create Design
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-vy-card border border-vy-border overflow-hidden">
              <div 
                className="p-6 flex flex-col md:flex-row gap-6 items-start cursor-pointer hover:bg-vy-black/40 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                {/* Images Preview */}
                <div className="flex -space-x-4 w-full md:w-auto shrink-0 justify-center md:justify-start">
                  {order.imageUrls?.length > 0 ? (
                    order.imageUrls.map((url, i) => (
                      <div key={i} className="w-20 h-24 bg-vy-dark border-2 border-vy-border relative z-0 hover:z-10 transition-transform hover:scale-110 shadow-lg">
                        <img src={url} alt="Design" className="w-full h-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="w-20 h-24 bg-vy-dark border-2 border-vy-border flex items-center justify-center text-[10px] text-vy-grey uppercase tracking-widest text-center px-1">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-vy-white font-bold text-lg tracking-wider">Custom {order.color} Tee</h3>
                    <p className="text-vy-grey text-xs uppercase tracking-widest">
                      {order.position} Print · Size {order.size}
                    </p>
                    <p className="text-vy-light font-mono text-sm pt-2">₹{order.price?.toLocaleString()}</p>
                    <p className="text-vy-border text-[10px] uppercase tracking-widest pt-1">
                      {order.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 justify-center items-center md:items-end w-full md:w-auto shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-vy-grey">Status:</span>
                      {order.status === 'Completed' || order.status === 'Delivered' ? (
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle size={12} /> {order.status}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={12} /> {order.status || 'Processing'}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                      className="w-full md:w-auto px-6 py-2.5 bg-vy-white text-vy-black text-[10px] font-bold uppercase tracking-widest hover:bg-vy-grey transition-colors flex justify-center items-center gap-2 mt-2 md:mt-0"
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
                    className="border-t border-vy-border bg-vy-black/20 overflow-hidden"
                  >
                    <div className="p-6 md:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-vy-grey text-[10px] uppercase tracking-widest mb-4">Design Resources</h4>
                          {order.imageUrls?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              {order.imageUrls.map((url, i) => (
                                <div key={i} className="bg-vy-dark border border-vy-border p-3">
                                  <img src={url} alt="Design" className="w-full aspect-square object-contain mx-auto" />
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="mt-3 flex items-center justify-center gap-2 text-vy-grey text-xs hover:text-vy-white transition-colors"
                                  >
                                    <ExternalLink size={12} /> View Full
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 border border-dashed border-vy-border text-center text-vy-grey text-xs">
                              No images were uploaded. Design was communicated via WhatsApp.
                            </div>
                          )}
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="text-vy-grey text-[10px] uppercase tracking-widest mb-3">Order Details</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-b border-vy-border/50 pb-2">
                                <span className="text-vy-grey">Order ID</span>
                                <span className="text-vy-white font-mono">{order.id}</span>
                              </div>
                              <div className="flex justify-between border-b border-vy-border/50 pb-2">
                                <span className="text-vy-grey">Placement</span>
                                <span className="text-vy-white capitalize">{order.position}</span>
                              </div>
                              <div className="flex justify-between border-b border-vy-border/50 pb-2">
                                <span className="text-vy-grey">Base Price</span>
                                <span className="text-vy-white font-mono">₹{order.basePrice?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-b border-vy-border/50 pb-2">
                                <span className="text-vy-grey">Discount</span>
                                <span className="text-vy-white font-mono">{order.discount > 0 ? `-₹${order.discount}` : '—'}</span>
                              </div>
                              <div className="flex justify-between pt-1">
                                <span className="text-vy-grey font-bold">Total</span>
                                <span className="text-vy-white font-bold font-mono text-sm">₹{order.price?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-vy-grey text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                              <AlertCircle size={12} /> Design Notes
                            </h4>
                            <div className="p-4 bg-vy-dark border border-vy-border text-vy-light text-xs italic leading-relaxed">
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
