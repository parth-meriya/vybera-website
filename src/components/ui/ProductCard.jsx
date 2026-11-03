import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../firebase/users';
import { getProductPricing } from '../../utils/pricing';
import toast from 'react-hot-toast';

const PLACEHOLDER = '/hero_banner.png';
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

const ProductCard = ({ product }) => {
  const { addItem, campaign } = useCart();
  const { user } = useAuth();
  const pricing = getProductPricing(product, campaign);

  const availableSizes = product?.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES;
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || 'M');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  // Check wishlist state
  useEffect(() => {
    if (user?.uid) {
      getUserProfile(user.uid).then((prof) => {
        if (prof?.wishlist?.includes(product.id)) {
          setIsWishlisted(true);
        }
      }).catch(() => {});
    } else {
      try {
        const local = JSON.parse(localStorage.getItem('vy_wishlist') || '[]');
        if (local.includes(product.id)) setIsWishlisted(true);
      } catch {
        // Ignore
      }
    }
  }, [user, product.id]);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    // Save to user profile or localStorage
    if (user?.uid) {
      try {
        const prof = await getUserProfile(user.uid);
        const curWish = prof?.wishlist || [];
        const updated = nextState
          ? [...new Set([...curWish, product.id])]
          : curWish.filter((id) => id !== product.id);
        await updateUserProfile(user.uid, { wishlist: updated });
      } catch (err) {
        console.warn('Wishlist update warning:', err);
      }
    } else {
      try {
        const local = JSON.parse(localStorage.getItem('vy_wishlist') || '[]');
        const updated = nextState
          ? [...new Set([...local, product.id])]
          : local.filter((id) => id !== product.id);
        localStorage.setItem('vy_wishlist', JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }

    toast.success(
      nextState ? `Saved to Wishlist: ${product.name}` : `Removed from Wishlist: ${product.name}`,
      { className: 'toast-vybera' }
    );
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.inStock === false) return;

    setAdding(true);
    addItem(
      {
        ...product,
        price: pricing.price,
        compareAtPrice: pricing.compareAtPrice,
      },
      selectedSize,
      1
    );

    setTimeout(() => setAdding(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group flex flex-col h-full bg-[#FAF5ED] border border-vy-border-light overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#30231F]/5"
    >
      <Link to={`/product/${product.id}`} className="block relative">
        {/* Product Image Frame */}
        <div className="img-zoom relative aspect-[3/4] w-full bg-vy-cream overflow-hidden">
          <img
            src={product.images?.[0] || product.image || PLACEHOLDER}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              if (e.target.src.includes('hero_banner.png')) return;
              e.target.src = '/hero_banner.png';
            }}
          />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10">
            {product.isDrop && (
              <span className="bg-vy-burgundy text-[#FAF5ED] text-[9px] font-bold tracking-[0.25em] px-2 py-0.5 uppercase shadow-sm">
                LIMITED DROP
              </span>
            )}
            {pricing.discountPercent > 0 && (
              <span className="bg-[#FAF5ED] text-vy-burgundy border border-vy-burgundy text-[9px] font-black tracking-wider px-2 py-0.5 uppercase shadow-sm">
                -{pricing.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label="Save to Wishlist"
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${
              isWishlisted
                ? 'bg-vy-burgundy text-[#FAF5ED] shadow-md scale-105'
                : 'bg-white/80 text-vy-text hover:bg-white hover:text-vy-burgundy shadow-sm'
            }`}
          >
            <Heart size={14} className={isWishlisted ? 'fill-current' : ''} />
          </button>

          {/* Quick Add Overlay on Desktop Hover */}
          {product.inStock !== false ? (
            <div className="hidden md:flex absolute inset-x-3 bottom-3 flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-20">
              {/* Quick Size Picker */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1 bg-[#FAF5ED]/95 backdrop-blur-sm p-1.5 border border-vy-border-light shadow-md"
              >
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(sz);
                    }}
                    className={`text-[10px] font-bold px-2 py-1 transition-all ${
                      selectedSize === sz
                        ? 'bg-vy-burgundy text-white'
                        : 'text-vy-text hover:bg-vy-cream'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleQuickAdd}
                className="w-full bg-vy-burgundy text-[#FFFFFF] text-[10px] font-bold tracking-[0.2em] uppercase py-3 flex items-center justify-center gap-2 hover:bg-vy-burgundy-hover transition-colors shadow-lg"
              >
                {adding ? (
                  <>
                    <Check size={13} /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={13} /> Quick Add ({selectedSize})
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="absolute inset-x-3 bottom-3 bg-white/95 text-vy-text-secondary text-[10px] font-bold tracking-widest uppercase py-2.5 text-center border border-vy-border shadow-sm">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 flex flex-col flex-1 justify-between bg-[#FAF5ED]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#75665C] mb-1">
              {product.category || 'OVERSIZED T-SHIRT'}
            </p>
            <h3 className="text-vy-text text-sm font-semibold tracking-wide truncate group-hover:text-vy-burgundy transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-vy-burgundy text-base font-bold tracking-tight">
                ₹{pricing.price.toLocaleString()}
              </span>
              {pricing.compareAtPrice && pricing.compareAtPrice > pricing.price && (
                <span className="text-[#75665C] text-xs line-through font-medium">
                  ₹{pricing.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Mobile sizes indicator */}
            <div className="flex md:hidden items-center gap-1 text-[9px] font-bold text-[#75665C] uppercase">
              {availableSizes.slice(0, 3).join(' • ')}
              {availableSizes.length > 3 && '+'}
            </div>
          </div>
        </div>
      </Link>

      {/* Mobile-only Quick Add Button */}
      {product.inStock !== false && (
        <div className="p-3 pt-0 md:hidden bg-[#FAF5ED]">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="w-full bg-vy-burgundy text-[#FFFFFF] text-[10px] font-bold tracking-[0.18em] uppercase py-2.5 flex items-center justify-center gap-2 active:bg-vy-burgundy-hover"
          >
            <ShoppingBag size={12} />
            Quick Add
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ProductCard;
