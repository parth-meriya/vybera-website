import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, SlidersHorizontal, Search, Layers, ArrowRight } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { getCollectionProducts, listenToProducts } from '../firebase/products';
import { getSections } from '../firebase/sections';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const DEFAULT_COLLECTIONS = [
  { slug: 'all', label: 'All Collections' },
  { slug: 'oversized', label: 'Oversized T-Shirts (USP)' },
  { slug: 'couple', label: 'Couple Edition' },
  { slug: 'embroidery', label: 'Embroidery' },
  { slug: 'anime', label: 'Anime Collection' },
  { slug: 'gaming', label: 'Gaming Drops' },
  { slug: 'meme', label: 'Meme & Culture' },
  { slug: 'coffee', label: 'Coffee & Chill' },
  { slug: 'cute-mascot', label: 'Cute Mascot' },
  { slug: 'custom-designs', label: 'Custom Designs' },
  { slug: 'kids', label: 'Kids Edition' },
  { slug: 'normal', label: 'Regular Fits' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1000', min: 0, max: 999 },
  { label: '₹1000 – ₹2000', min: 1000, max: 2000 },
  { label: 'Above ₹2000', min: 2000, max: Infinity },
];

const Collections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    getSections().then((s) => setSections(s || [])).catch(() => setSections([]));

    const unsubscribe = listenToProducts(
      (allProds) => {
        const colls = (allProds || []).filter((p) => p.showInCollections !== false);
        setProducts(colls);
        setLoading(false);
      },
      () => {
        getCollectionProducts()
          .then((allCollectionProducts) => {
            setProducts(allCollectionProducts || []);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Error fetching collections:', err);
            setLoading(false);
          });
      }
    );
    return () => unsubscribe();
  }, []);

  // Update selected category when URL query parameter changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Combine default collections with dynamic sections from admin
  const allCategoryTabs = [
    ...DEFAULT_COLLECTIONS,
    ...sections
      .filter((s) => !DEFAULT_COLLECTIONS.some((c) => c.slug.toLowerCase() === s.slug.toLowerCase()))
      .map((s) => ({ slug: s.slug, label: s.label })),
  ];

  // Filter products
  const filteredProducts = products.filter((p) => {
    // 1. Category filter
    if (selectedCategory !== 'all') {
      const pCat = (p.category || '').toLowerCase();
      const targetCat = selectedCategory.toLowerCase();
      if (pCat !== targetCat && !pCat.includes(targetCat) && !targetCat.includes(pCat)) {
        return false;
      }
    }

    // 2. Size filter
    if (selectedSizes.length > 0) {
      const hasSize = (p.sizes || []).some((sz) => selectedSizes.includes(sz));
      if (!hasSize) return false;
    }

    // 3. Price filter
    const range = PRICE_RANGES[selectedPrice];
    if (range && (p.price < range.min || p.price > range.max)) {
      return false;
    }

    // 4. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchDesc) return false;
    }

    return true;
  });

  const handleSelectCategory = (slug) => {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slug });
    }
  };

  const toggleSize = (sz) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSizes([]);
    setSelectedPrice(0);
    setSearchQuery('');
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedSizes.length > 0 || selectedPrice !== 0 || Boolean(searchQuery.trim());

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#30231F] pt-24 pb-20">
      <SEO
        title="COLLECTIONS | VYBERA — The Era of Vibes Complete Streetwear Catalog"
        description="Browse all VYBERA streetwear collections: Anime, Gaming, Meme, Oversized, Couple Edition, Embroidery, Cute Mascot, and Custom Prints. Engineered with 240+ GSM combed cotton."
        keywords="VYBERA collections, oversized t-shirts, anime streetwear, gaming tees, couple tees, custom t-shirt printing"
        path="/collections"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-6">
          <BackButton label="Home" to="/" />
        </div>

        {/* ── Editorial Header with Background Image ────────────────── */}
        <div className="relative mb-12 p-8 md:p-14 bg-[#1E1614] text-[#FAF5ED] overflow-hidden border border-[#D4BEA5]/40 shadow-2xl">
          {/* Photoshoot Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/Design/6th%20girl/ChatGPT%20Image%20May%204,%202026,%2009_39_33%20AM.png"
              alt="VYBERA Collections"
              className="w-full h-full object-cover object-[75%_center] opacity-40 scale-105"
              onError={(e) => {
                e.target.src = '/hero_banner.png';
              }}
            />
            {/* Multi-Stop Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E1614] via-[#1E1614]/90 md:via-[#1E1614]/75 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E1614] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-[#590907]/15 mix-blend-multiply z-10 pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#E8D2B5] text-[#590907] text-[10px] font-black tracking-[0.3em] uppercase mb-4 shadow-lg">
              <Sparkles size={12} className="text-[#590907]" />
              FULL BRAND CATALOG & ARCHIVES
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-[#FAF5ED] mb-4 leading-none">
              THE COLLECTIONS.
            </h1>

            <p className="text-xs sm:text-sm text-[#F3E7D8]/90 uppercase tracking-widest leading-relaxed font-medium max-w-xl">
              Discover our entire design spectrum: Anime, Gaming, Meme, Oversized, Couple, and Bespoke.
              Constructed with 240+ GSM heavyweight combed cotton and structured streetwear drapes.
            </p>
          </div>
        </div>

        {/* ── Category Tabs (Horizontal Scroll on Mobile) ───────────── */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {allCategoryTabs.map((tab) => {
              const active = selectedCategory.toLowerCase() === tab.slug.toLowerCase();
              return (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => handleSelectCategory(tab.slug)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs border transition-all ${
                    active
                      ? 'bg-[#590907] border-[#590907] text-white shadow-xs'
                      : 'bg-white border-[#D4BEA5] text-[#75665C] hover:border-[#590907] hover:text-[#30231F]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search & Filter Controls ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#D4BEA5]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#75665C]">
              Showing <span className="text-[#590907] font-black">{filteredProducts.length}</span> Products
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-bold tracking-wider text-[#590907] uppercase underline hover:text-[#430605]"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75665C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#D4BEA5] text-xs text-[#30231F] rounded-xs focus:outline-none focus:border-[#590907]"
              />
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D4BEA5] text-xs font-bold uppercase tracking-wider text-[#30231F]"
            >
              <SlidersHorizontal size={14} />
              Filter
            </button>
          </div>
        </div>

        {/* ── Size & Price Filter Bar (Desktop) ──────────────────────── */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-4 mb-8 p-3 bg-white border border-[#D4BEA5]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] mr-2">Size:</span>
            {SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => toggleSize(sz)}
                className={`w-8 h-8 text-[11px] font-bold border transition-all ${
                  selectedSizes.includes(sz)
                    ? 'bg-[#590907] border-[#590907] text-white'
                    : 'bg-[#FAF5ED] border-[#D4BEA5] text-[#30231F] hover:border-[#590907]'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] mr-2">Price:</span>
            {PRICE_RANGES.map((rng, i) => (
              <button
                key={rng.label}
                type="button"
                onClick={() => setSelectedPrice(i)}
                className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider border transition-all ${
                  selectedPrice === i
                    ? 'bg-[#590907] border-[#590907] text-white shadow-xs'
                    : 'bg-[#FAF5ED] border-[#D4BEA5] text-[#75665C] hover:text-[#30231F]'
                }`}
              >
                {rng.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile Filter Drawer ───────────────────────────────────── */}
        {filterDrawerOpen && (
          <div className="sm:hidden p-4 mb-6 bg-white border border-[#D4BEA5] space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-2">Sizes</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`w-8 h-8 text-xs font-bold border ${
                      selectedSizes.includes(sz)
                        ? 'bg-[#590907] border-[#590907] text-white'
                        : 'bg-[#FAF5ED] border-[#D4BEA5] text-[#30231F]'
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
                        : 'bg-[#FAF5ED] border-[#D4BEA5] text-[#30231F]'
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
            <Layers size={36} className="mx-auto text-[#590907] mb-3 opacity-60" />
            <h3 className="font-display font-black text-2xl uppercase tracking-wider text-[#30231F] mb-2">
              No Products Found
            </h3>
            <p className="text-xs text-[#75665C] uppercase tracking-wider mb-6">
              Try adjusting your category or filter selections.
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

export default Collections;
