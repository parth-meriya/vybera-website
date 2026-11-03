import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Scissors } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { getProductsByCategory } from '../firebase/products';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1000', min: 0, max: 999 },
  { label: '₹1000 – ₹2000', min: 1000, max: 2000 },
  { label: '₹2000 – ₹3000', min: 2000, max: 3000 },
  { label: 'Above ₹3000', min: 3000, max: Infinity },
];

/* ── Embroidery "Coming Soon" visual ──────────────────── */
const ComingSoon = () => (
  <div className="min-h-screen bg-[#F3E7D8] pt-24 flex items-center justify-center relative">
    <div className="absolute top-24 left-6 md:left-12">
      <BackButton />
    </div>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="text-center px-6 max-w-lg bg-[#FAF5ED] border border-[#D4BEA5] rounded-3xl p-10 md:p-14 shadow-sm"
    >
      {/* Animated stitch ring */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full border border-dashed border-[#D4BEA5] mb-8 relative"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          <Scissors size={32} className="text-[#590907]" />
        </motion.div>
      </motion.div>

      <h1 className="font-display font-black text-3xl md:text-4xl tracking-wider text-[#30231F] mb-4">
        Embroidery Collection
      </h1>
      <p className="text-[#590907] text-sm font-bold tracking-[0.3em] uppercase mb-3">
        Coming Soon
      </p>
      <p className="text-[#75665C] text-xs leading-relaxed max-w-sm mx-auto font-medium">
        Hand-crafted embroidery on premium fabric. Every thread placed with intention. Stay tuned for the drop.
      </p>

      {/* Decorative stitch line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.4 }}
        className="mt-8 mx-auto h-px w-40 bg-gradient-to-r from-transparent via-[#590907]/40 to-transparent"
      />
    </motion.div>
  </div>
);

/* ── Product grid (auto-enabled when embroidery products exist) */
const ProductGrid = ({ products: allProducts }) => {
  const [filtered, setFiltered] = useState(allProducts);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(0);

  useEffect(() => {
    let result = [...allProducts];
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        p.sizes?.some(s => selectedSizes.includes(s))
      );
    }
    const range = PRICE_RANGES[selectedPrice];
    result = result.filter(p => p.price >= range.min && p.price <= range.max);
    setFiltered(result);
  }, [selectedSizes, selectedPrice, allProducts]);

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

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#30231F] pt-28 pb-20">
      <SEO
        title="Embroidery Collection"
        description="Hand-crafted embroidery on premium heavyweight fabric. Every thread placed with intention. Discover the collection."
        keywords="embroidered streetwear, premium embroidered t-shirts, custom embroidery India, VYBERA embroidery"
        path="/embroidery"
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
            <p className="text-[#A5A79B] text-[10px] tracking-[0.3em] uppercase font-bold mb-1">Crafted by Hand</p>
            <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-[#30231F] uppercase flex items-center gap-3">
              EMBROIDERY
              <Scissors size={26} className="text-[#590907]" />
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
            <span className="text-[#7A6E69] text-xs font-semibold">{filtered.length} items</span>
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
        {filtered.length === 0 ? (
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

/* ── Main page component ─────────────────────────────── */
const Embroidery = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductsByCategory('embroidery').then(p => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-vy-black pt-24">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pt-16 pb-20">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-vy-card border border-vy-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* Future-ready: auto-switch from Coming Soon → product grid */
  if (products.length === 0) return <ComingSoon />;
  return <ProductGrid products={products} />;
};

export default Embroidery;
