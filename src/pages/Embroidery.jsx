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
  <div className="min-h-screen bg-vy-black pt-24 flex items-center justify-center relative">
    <div className="absolute top-24 left-6 md:left-12">
      <BackButton />
    </div>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="text-center px-6 max-w-lg"
    >
      {/* Animated stitch ring */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full border border-dashed border-vy-grey/30 mb-8 relative"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          <Scissors size={32} className="text-vy-accent" />
        </motion.div>
      </motion.div>

      <h1 className="font-display font-bold text-4xl md:text-5xl tracking-wider text-vy-white mb-4">
        Embroidery Collection
      </h1>
      <p className="text-vy-accent text-sm font-semibold tracking-[0.3em] uppercase mb-3">
        Coming Soon
      </p>
      <p className="text-vy-border text-xs leading-relaxed max-w-sm mx-auto">
        Hand-crafted embroidery on premium fabric. Every thread placed with intention. Stay tuned for the drop.
      </p>

      {/* Decorative stitch line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.4 }}
        className="mt-10 mx-auto h-px w-40 bg-gradient-to-r from-transparent via-vy-accent/40 to-transparent"
      />

      {/* Floating thread particles */}
      <div className="relative mt-8 h-8 overflow-hidden">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            animate={{ x: [-20, 20, -20], y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.4, delay: i * 0.3, ease: 'easeInOut' }}
            className="absolute top-1/2 rounded-full bg-vy-accent/20"
            style={{
              width: 2 + i,
              height: 2 + i,
              left: `${15 + i * 18}%`,
            }}
          />
        ))}
      </div>
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
    <div className="min-h-screen bg-vy-black pt-24">
      <SEO
        title="Embroidery Collection"
        description="Hand-crafted embroidery on premium heavyweight fabric. Every thread placed with intention. Discover the collection."
        keywords="embroidered streetwear, premium embroidered t-shirts, custom embroidery India, VYBERA embroidery"
        path="/embroidery"
      />
      <div className="max-w-screen-xl mx-auto px-6 md:px-12">
        <div className="mb-6">
          <BackButton />
        </div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10 border-b border-vy-border pb-6"
        >
          <div>
            <p className="text-vy-grey text-xs tracking-[0.5em] uppercase mb-1">Crafted by Hand</p>
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white flex items-center gap-3">
              EMBROIDERY
              <Scissors size={20} className="text-vy-accent" />
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
