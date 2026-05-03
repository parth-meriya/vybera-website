import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { getProducts } from '../firebase/products';
import SEO from '../components/SEO';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1000', min: 0, max: 999 },
  { label: '₹1000 – ₹2000', min: 1000, max: 2000 },
  { label: '₹2000 – ₹3000', min: 2000, max: 3000 },
  { label: 'Above ₹3000', min: 3000, max: Infinity },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'normal', label: 'Normal' },
  { value: 'couple', label: 'Couple' },
  { value: 'embroidery', label: 'Embroidery' },
];

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    getProducts().then(p => {
      setProducts(p);
      setFiltered(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...products];
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        p.sizes?.some(s => selectedSizes.includes(s))
      );
    }
    const range = PRICE_RANGES[selectedPrice];
    result = result.filter(p => p.price >= range.min && p.price <= range.max);
    setFiltered(result);
  }, [selectedSizes, selectedPrice, selectedCategory, products]);

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedPrice(0);
    setSelectedCategory('all');
  };

  const hasFilters = selectedSizes.length > 0 || selectedPrice !== 0 || selectedCategory !== 'all';

  return (
    <div className="min-h-screen bg-vy-black pt-24">
      <SEO
        title="Shop All Products"
        description="Browse the full VYBERA collection — premium oversized tees, limited drops, and exclusive streetwear. Free shipping across India."
        keywords="buy oversized tees, streetwear shop India, VYBERA collection, premium tees online, limited edition clothing"
        path="/shop"
      />
      <div className="max-w-screen-xl mx-auto px-6 md:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10 border-b border-vy-border pb-6"
        >
          <div>
            <p className="text-vy-grey text-xs tracking-[0.5em] uppercase mb-1">All Products</p>
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white">
              SHOP
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors"
              >
                <X size={12} /> Clear
              </button>
            )}
            <button
              onClick={() => setFilterOpen(o => !o)}
              className="flex items-center gap-2 text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors"
            >
              <SlidersHorizontal size={14} />
              Filter
            </button>
            <span className="text-vy-grey text-xs">{filtered.length} items</span>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <motion.div
          initial={false}
          animate={{ height: filterOpen ? 'auto' : 0, opacity: filterOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-vy-border">
            {/* Category filter */}
            <div>
              <p className="text-vy-grey text-xs tracking-widest uppercase mb-4">Category</p>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`text-left text-sm transition-colors duration-200 ${
                      selectedCategory === cat.value ? 'text-vy-white' : 'text-vy-grey hover:text-vy-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Size filter */}
            <div>
              <p className="text-vy-grey text-xs tracking-widest uppercase mb-4">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`size-btn ${selectedSizes.includes(size) ? 'selected' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            {/* Price filter */}
            <div>
              <p className="text-vy-grey text-xs tracking-widest uppercase mb-4">Price Range</p>
              <div className="flex flex-col gap-2">
                {PRICE_RANGES.map((range, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPrice(i)}
                    className={`text-left text-sm transition-colors duration-200 ${
                      selectedPrice === i ? 'text-vy-white' : 'text-vy-grey hover:text-vy-white'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-vy-card border border-vy-border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-vy-grey text-sm tracking-widest uppercase mb-4">No products found</p>
            <button onClick={clearFilters} className="btn-outline text-xs">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
