import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, SlidersHorizontal, Percent, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import { getSaleProducts } from '../firebase/products';
import { getProductPricing } from '../utils/pricing';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const DISCOUNT_TIERS = [
  { label: 'All Discounts', minDiscount: 0 },
  { label: '20% OFF & Above', minDiscount: 20 },
  { label: '30% OFF & Above', minDiscount: 30 },
  { label: '50% OFF & Above', minDiscount: 50 },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const Sale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    getSaleProducts()
      .then((saleList) => {
        setProducts(saleList);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching Sale products:', err);
        setLoading(false);
      });
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const pricing = getProductPricing(p);

    // 1. Discount tier filter
    const requiredDiscount = DISCOUNT_TIERS[selectedDiscount].minDiscount;
    if (requiredDiscount > 0 && pricing.discountPercent < requiredDiscount) {
      return false;
    }

    // 2. Size filter
    if (selectedSizes.length > 0) {
      const hasSize = (p.sizes || []).some((sz) => selectedSizes.includes(sz));
      if (!hasSize) return false;
    }

    return true;
  });

  const toggleSize = (sz) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const clearFilters = () => {
    setSelectedDiscount(0);
    setSelectedSizes([]);
  };

  const hasActiveFilters = selectedDiscount !== 0 || selectedSizes.length > 0;

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#30231F] pt-24 pb-20">
      <SEO
        title="SALE | VYBERA — Special Edition Streetwear Deals & Discounts"
        description="Shop exclusive sale pieces from VYBERA. Heavyweight oversized cotton T-shirts and limited streetwear editions with authentic discounts up to 70% OFF."
        keywords="VYBERA sale, streetwear sale, oversized t-shirt discount, streetwear deals, luxury fashion sale india"
        path="/sale"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-6">
          <BackButton label="Home" to="/" />
        </div>

        {/* ── Editorial Sale Campaign Hero ──────────────────────────── */}
        <div className="relative mb-12 p-8 md:p-14 bg-gradient-to-r from-[#590907] via-[#430605] to-[#241916] text-[#FAF5ED] overflow-hidden border border-[#D4AF37]/50 shadow-xl">
          {/* Subtle Golden Glow Accents */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.2),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37] text-[#30231F] text-[10px] font-black tracking-[0.3em] uppercase mb-4 shadow-sm">
              <Tag size={12} className="text-[#590907]" />
              LIMITED PROMOTION ARCHIVE
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-[#FAF5ED] mb-4 leading-none">
              THE SALE.
            </h1>

            <p className="text-xs sm:text-sm text-[#F3E7D8]/90 uppercase tracking-widest leading-relaxed font-medium">
              Hand-curated archive pieces and seasonal promotion drops.
              Genuine markdown prices with heavyweight luxury construction.
            </p>
          </div>
        </div>

        {/* ── Toolbar: Filter Bar & Result Count ─────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#D4BEA5]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#75665C]">
              Showing <span className="text-[#590907] font-black">{filteredProducts.length}</span> Sale Items
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
            {/* Quick Discount Tier Pills */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#E8D2B5]/40 p-1 border border-[#D4BEA5]">
              {DISCOUNT_TIERS.map((tier, i) => (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => setSelectedDiscount(i)}
                  className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all ${
                    selectedDiscount === i
                      ? 'bg-[#590907] text-white shadow-xs'
                      : 'text-[#75665C] hover:text-[#30231F]'
                  }`}
                >
                  {tier.label}
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
              Filters
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-2">Discount Level</p>
              <div className="grid grid-cols-2 gap-2">
                {DISCOUNT_TIERS.map((tier, i) => (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => setSelectedDiscount(i)}
                    className={`p-2 text-xs font-bold text-center border ${
                      selectedDiscount === i
                        ? 'bg-[#590907] border-[#590907] text-white'
                        : 'bg-white border-[#D4BEA5] text-[#30231F]'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-2">Sizes</p>
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
            <Tag size={36} className="mx-auto text-[#590907] mb-3 opacity-60" />
            <h3 className="font-display font-black text-2xl uppercase tracking-wider text-[#30231F] mb-2">
              No Sale Products Currently
            </h3>
            <p className="text-xs text-[#75665C] uppercase tracking-wider mb-6">
              Check back soon for new promotions and archive drops.
            </p>
            <Link
              to="/collections"
              className="inline-block px-8 py-3 bg-[#590907] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#430605]"
            >
              Browse Collections
            </Link>
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

export default Sale;
