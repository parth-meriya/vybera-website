import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../firebase/users';
import { getProductById } from '../../firebase/products';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;
      try {
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
        if (prof?.wishlist?.length > 0) {
          const items = await Promise.all(
            prof.wishlist.map(id => getProductById(id))
          );
          setWishlistItems(items.filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user]);

  const removeFromWishlist = async (productId) => {
    try {
      const newWishlist = (profile?.wishlist || []).filter(id => id !== productId);
      await updateUserProfile(user.uid, { wishlist: newWishlist });
      setProfile(p => ({ ...p, wishlist: newWishlist }));
      setWishlistItems(prev => prev.filter(item => item.id !== productId));
      toast.success('Removed from wishlist', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to remove item', { className: 'toast-vybera' });
    }
  };

  const moveToCart = (product) => {
    if (!product.sizes || product.sizes.length === 0) {
      toast.error('Product sizes not available', { className: 'toast-vybera' });
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0], // Default to first available size
      quantity: 1,
      isDrop: product.isDrop,
      selectedColor: product.colors?.[0] || null
    });
    
    removeFromWishlist(product.id);
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
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2">My Wishlist</h2>
        <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Saved products for later</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-vy-card border border-vy-border p-12 text-center flex flex-col items-center">
          <Heart size={48} className="text-vy-border mb-4" />
          <p className="text-vy-white text-lg font-bold mb-2">Your wishlist is empty</p>
          <p className="text-vy-grey text-xs mb-6">Explore our collections and save your favorite items.</p>
          <Link to="/shop" className="btn-primary text-xs py-3 px-8 uppercase tracking-widest">
            Browse Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-vy-card border border-vy-border overflow-hidden group">
              <Link to={`/product/${item.id}`} className="block relative aspect-[4/5] bg-vy-dark overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </Link>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/product/${item.id}`} className="hover:text-vy-grey transition-colors">
                    <h3 className="text-vy-white font-bold text-sm truncate pr-2">{item.name}</h3>
                  </Link>
                  <p className="text-vy-white font-mono text-sm">₹{item.price?.toLocaleString()}</p>
                </div>
                <p className="text-vy-grey text-xs capitalize mb-4">{item.category}</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => moveToCart(item)}
                    className="flex-1 py-2.5 bg-vy-white text-vy-black text-[10px] font-bold tracking-widest uppercase hover:bg-vy-grey transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={14} /> Move to Cart
                  </button>
                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    className="w-10 h-10 border border-vy-border flex items-center justify-center text-vy-grey hover:text-red-400 hover:border-red-400/50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Wishlist;
