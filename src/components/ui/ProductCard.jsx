import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSale } from '../../context/SaleContext';

const PLACEHOLDER = 'https://placehold.co/600x750/111111/D9C7A6?text=VYBERA';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const { getDiscountedPrice, activeSale, isProductOnSale, getDiscountLabel } = useSale();

  const displayPrice = getDiscountedPrice(product.price, product.id);
  const isOnSale = isProductOnSale(product.id) && displayPrice < product.price;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.sizes?.[0] || 'M';
    addItem(product, defaultSize, 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to={`/product/${product.id}`} className="group block">
        {/* Image */}
        <div className="img-zoom relative bg-vy-card aspect-[3/4] overflow-hidden border border-vy-border/30 group-hover:shadow-lg group-hover:shadow-black/20 transition-shadow duration-500">
          <img
            src={product.images?.[0] || product.image || PLACEHOLDER}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-700 ${!product.isDrop && 'group-hover:scale-105'}`}
          />
          {/* Sale badge */}
          {isOnSale && (
            <div className="absolute top-3 left-3 bg-vy-accent text-vy-black text-[10px] font-bold px-2 py-1 tracking-widest">
              {getDiscountLabel()} OFF
            </div>
          )}
          {/* Drop badge */}
          {product.isDrop && (
            <div className="absolute top-3 right-3 border border-vy-accent text-vy-accent text-[10px] font-medium px-2 py-1 tracking-widest">
              DROP
            </div>
          )}
          {/* Quick Add overlay */}
          {product.inStock !== false ? (
            <motion.button
              onClick={handleQuickAdd}
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 bg-vy-accent text-vy-black text-xs font-semibold tracking-widest uppercase py-3 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <ShoppingBag size={14} />
              Quick Add
            </motion.button>
          ) : (
            <div className="absolute bottom-4 left-4 right-4 bg-vy-dark/95 border border-vy-border text-vy-grey text-xs font-semibold tracking-widest uppercase py-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              Out of Stock
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-3 pb-2">
          <h3 className="text-vy-white text-sm font-medium tracking-wide truncate group-hover:text-vy-accent transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-vy-accent text-sm font-semibold">
              ₹{displayPrice.toLocaleString()}
            </span>
            {isOnSale && (
              <span className="text-vy-grey text-xs line-through">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
