import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Baby } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { getProductsByCategory } from '../firebase/products';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const SIZES = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y', 'S', 'M', 'L', 'XL', 'XXL'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹500', min: 0, max: 499 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: '₹1000 – ₹2000', min: 1000, max: 2000 },
  { label: 'Above ₹2000', min: 2000, max: Infinity },
];

const Kids = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(0);

  useEffect(() => {
    getProductsByCategory('kids').then(p => {
      setProducts(p);
      setFiltered(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...products];
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        p.sizes?.some(s => selectedSizes.includes(s))
      );
    }
    const range = PRICE_RANGES[selectedPrice];
    result = result.filter(p => p.price >= range.min && p.price <= range.max);
    setFiltered(result);
  }, [selectedSizes, selectedPrice, products]);

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedPrice(0);
  };

  const hasFilters = selectedSizes.length > 0 || selectedPrice !== 0;

  /* ── Empty / Coming Soon state ─────────────────────── */
  if (!loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#F3E7D8] pt-24 flex items-center justify-center relative">
        <SEO
          title="Kids Collection"
          description="Premium kids streetwear coming soon to VYBERA. Stylish, comfy, and bold outfits for little trendsetters."
          keywords="kids streetwear, kids oversized tees, kids fashion India, VYBERA kids collection"
          path="/kids"
        />
        <div className="absolute top-24 left-6 md:left-12">
          <BackButton />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center px-6 max-w-lg bg-[#FAF5ED] border border-[#D4BEA5] rounded-3xl p-10 md:p-14 shadow-sm"
        >
          {/* Animated icon */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border border-amber-200 mb-8"
          >
            <Baby size={32} className="text-[#590907]" />
          </motion.div>

          <h1 className="font-display font-black text-3xl md:text-4xl tracking-wider text-[#30231F] mb-4">
            Kids Collection
          </h1>
          <p className="text-[#590907] text-sm font-bold leading-relaxed mb-2 uppercase tracking-widest">
            Coming Soon 🧸
          </p>
          <p className="text-[#75665C] text-xs leading-relaxed max-w-sm mx-auto font-medium">
            Stylish, comfy, and bold fits for little trendsetters. Be the first to know when we drop — follow us on socials.
          </p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="mt-8 mx-auto h-px w-32 bg-gradient-to-r from-transparent via-[#590907]/40 to-transparent"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#30231F] pt-28 pb-20">
      <SEO
        title="Kids Collection"
        description="Shop premium kids streetwear at VYBERA. Oversized tees, bold prints, and comfy fits for young trendsetters."
        keywords="kids streetwear, kids oversized tees, kids fashion India, VYBERA kids collection"
        path="/kids"
      />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        <div className="mb-6">
          <BackButton />
        </div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-[#E5DACD] pb-6"
        >
          <div>
            <p className="text-[#A5A79B] text-[10px] tracking-[0.3em] uppercase font-bold mb-1">Little Ones</p>
            <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-[#30231F] uppercase flex items-center gap-3">
              KIDS
              <Baby size={26} className="text-[#590907]" />
            </h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-[#590907] text-xs tracking-wider uppercase font-bold hover:underline"
              >
                <X size={13} /> Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilterOpen(o => !o)}
              className="btn-secondary !py-2 !px-4 text-xs font-bold tracking-wider uppercase"
            >
              <SlidersHorizontal size={14} />
              {filterOpen ? 'Hide Filters' : 'Filter Products'}
            </button>
            <span className="text-[#7A6E69] text-xs font-semibold">{filtered.length} products</span>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <motion.div
          initial={false}
          animate={{ height: filterOpen ? 'auto' : 0, opacity: filterOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-vy-border">
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

export default Kids;
