import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, SlidersHorizontal, X, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import { getNewDropProducts } from '../firebase/products';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1000', min: 0, max: 999 },
  { label: '₹1000 – ₹2000', min: 1000, max: 2000 },
  { label: 'Above ₹2000', min: 2000, max: Infinity },
];

const NewDrops = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    getNewDropProducts()
      .then((drops) => {
        setProducts(drops);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching New Drops:', err);
        setLoading(false);
      });
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    // 1. Size filter
    if (selectedSizes.length > 0) {
      const hasSize = (p.sizes || []).some((sz) => selectedSizes.includes(sz));
      if (!hasSize) return false;
    }

    // 2. Price filter
    const range = PRICE_RANGES[selectedPrice];
    if (range && (p.price < range.min || p.price > range.max)) {
      return false;
    }

    return true;
  });

  const toggleSize = (sz) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedPrice(0);
  };

  const hasActiveFilters = selectedSizes.length > 0 || selectedPrice !== 0;

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#30231F] pt-24 pb-20">
      <SEO
        title="NEW DROPS | VYBERA — Limited Release Oversized Streetwear"
        description="Explore the latest limited drops by VYBERA. Engineered from 240+ GSM heavyweight cotton with boxy streetwear silhouettes. Only available while drops last."
        keywords="VYBERA new drops, limited streetwear release, oversized drops, boxy tees, streetwear india"
        path="/new-drops"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-6">
          <BackButton label="Home" to="/" />
        </div>

        {/* ── Editorial Campaign Hero with Background Image ─────────── */}
        <div className="relative mb-12 p-8 md:p-14 bg-[#1E1614] text-[#FAF5ED] overflow-hidden border border-[#D4BEA5]/40 shadow-2xl">
          {/* Photoshoot Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/Design/7th%20boy/ChatGPT%20Image%20May%204,%202026,%2010_13_22%20AM.png"
              alt="VYBERA New Drops"
              className="w-full h-full object-cover object-[70%_25%] md:object-[80%_center] opacity-45 scale-105"
              onError={(e) => {
                e.target.src = '/hero_banner.png';
              }}
            />
            {/* Editorial Multi-Stop Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E1614] via-[#1E1614]/90 md:via-[#1E1614]/75 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E1614] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-[#590907]/20 mix-blend-multiply z-10 pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#590907] text-[#FAF5ED] text-[10px] font-black tracking-[0.3em] uppercase mb-4 shadow-lg border border-[#D4BEA5]/30">
              <Flame size={12} className="text-amber-300" />
              EXCLUSIVE DROP ARCHIVE
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-[#FAF5ED] mb-4 leading-none">
              NEW DROPS.
            </h1>

            <p className="text-xs sm:text-sm text-[#F3E7D8]/90 uppercase tracking-widest leading-relaxed font-medium max-w-xl">
              Hand-selected limited releases designed for those who shape what’s next.
              Crafted from 240+ GSM heavyweight combed cotton. Once sold out, they are archived forever.
            </p>
          </div>
        </div>

        {/* ── Toolbar: Filter Bar & Result Count ─────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#D4BEA5]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#75665C]">
              Showing <span className="text-[#590907] font-black">{filteredProducts.length}</span> Active Drops
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-bold tracking-wider text-[#590907] uppercase underline hover:text-[#430605]"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Price Pills */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#E8D2B5]/40 p-1 border border-[#D4BEA5]">
              {PRICE_RANGES.map((rng, i) => (
                <button
                  key={rng.label}
                  type="button"
                  onClick={() => setSelectedPrice(i)}
                  className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all ${
                    selectedPrice === i
                      ? 'bg-[#590907] text-white shadow-xs'
                      : 'text-[#75665C] hover:text-[#30231F]'
                  }`}
                >
                  {rng.label}
                </button>
              ))}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="md:hidden inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#D4BEA5] text-xs font-bold uppercase tracking-wider text-[#30231F]"
            >
              <SlidersHorizontal size={14} />
              Filter By Size
            </button>
          </div>
        </div>

        {/* ── Size Quick Filter Bar (Desktop) ────────────────────────── */}
        <div className="hidden md:flex items-center gap-2 mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#75665C] mr-2">Filter By Size:</span>
          {SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => toggleSize(sz)}
              className={`w-9 h-9 text-xs font-bold border transition-all ${
                selectedSizes.includes(sz)
                  ? 'bg-[#590907] border-[#590907] text-white'
                  : 'bg-white border-[#D4BEA5] text-[#30231F] hover:border-[#590907]'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>

        {/* ── Mobile Filter Drawer ───────────────────────────────────── */}
        {filterDrawerOpen && (
          <div className="md:hidden p-4 mb-6 bg-white border border-[#D4BEA5] space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-2">Select Sizes</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`w-9 h-9 text-xs font-bold border ${
                      selectedSizes.includes(sz)
                        ? 'bg-[#590907] border-[#590907] text-white'
                        : 'bg-white border-[#D4BEA5] text-[#30231F]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-2">Price Range</p>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_RANGES.map((rng, i) => (
                  <button
                    key={rng.label}
                    type="button"
                    onClick={() => setSelectedPrice(i)}
                    className={`p-2 text-xs font-bold text-center border ${
                      selectedPrice === i
                        ? 'bg-[#590907] border-[#590907] text-white'
                        : 'bg-white border-[#D4BEA5] text-[#30231F]'
                    }`}
                  >
                    {rng.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Product Grid: 2 columns on mobile, 4 on desktop ────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[3/4] bg-[#E8D2B5]/30 animate-pulse border border-[#D4BEA5]" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[#D4BEA5] p-8">
            <Flame size={36} className="mx-auto text-[#590907] mb-3 opacity-60" />
            <h3 className="font-display font-black text-2xl uppercase tracking-wider text-[#30231F] mb-2">
              No Drops Matching Filters
            </h3>
            <p className="text-xs text-[#75665C] uppercase tracking-wider mb-6">
              Check back soon for the next exclusive limited edition drop.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="px-8 py-3 bg-[#590907] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#430605]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewDrops;
