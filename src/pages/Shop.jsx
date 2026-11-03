import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Flame } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { getProducts, listenToProducts } from '../firebase/products';
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

const CATEGORIES = [
  { value: 'all', label: 'All Collections' },
  { value: 'Oversized', label: 'Oversized T-Shirts (USP)' },
  { value: 'Drops', label: 'Limited Drops' },
  { value: 'Couple', label: 'Couple Edition' },
  { value: 'Embroidery', label: 'Embroidery' },
  { value: 'Normal', label: 'Regular Fits' },
];

const Shop = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilterParam, setActiveFilterParam] = useState('');

  useEffect(() => {
    const unsubscribe = listenToProducts(
      (p) => {
        const list = p || [];
        setProducts(list);
        setFiltered(list);
        setLoading(false);
      },
      () => {
        getProducts()
          .then((p) => {
            const list = p || [];
            setProducts(list);
            setFiltered(list);
            setLoading(false);
          })
          .catch(() => {
            setProducts([]);
            setFiltered([]);
            setLoading(false);
          });
      }
    );

    return () => unsubscribe();
  }, []);

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    const category = params.get('category');

    if (filter) {
      setActiveFilterParam(filter);
      if (filter === 'drops') {
        setSelectedCategory('Drops');
      } else if (filter === 'sale') {
        // Filter by sale drops
        setActiveFilterParam('sale');
      }
    } else if (category) {
      const match = CATEGORIES.find(
        (c) => c.value.toLowerCase() === category.toLowerCase()
      );
      if (match) setSelectedCategory(match.value);
    }
  }, [location.search]);

  useEffect(() => {
    let result = [...products];

    // Filter param check
    if (activeFilterParam === 'drops') {
      result = result.filter((p) => p.isDrop === true);
    } else if (activeFilterParam === 'sale') {
      result = result.filter(
        (p) =>
          (p.compareAtPrice && p.compareAtPrice > p.price) ||
          p.campaignPrice ||
          p.isDrop
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Drops') {
        result = result.filter((p) => p.isDrop === true);
      } else {
        result = result.filter(
          (p) =>
            p.category &&
            p.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.sizes?.some((s) => selectedSizes.includes(s))
      );
    }

    const range = PRICE_RANGES[selectedPrice];
    result = result.filter((p) => p.price >= range.min && p.price <= range.max);

    setFiltered(result);
  }, [selectedSizes, selectedPrice, selectedCategory, activeFilterParam, products]);

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedPrice(0);
    setSelectedCategory('all');
    setActiveFilterParam('');
  };

  const hasFilters =
    selectedSizes.length > 0 ||
    selectedPrice !== 0 ||
    selectedCategory !== 'all' ||
    Boolean(activeFilterParam);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://vybera.shop',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: 'https://vybera.shop/shop',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF5ED] pt-28 pb-20 text-[#30231F]">
      <SEO
        title="Shop Collections — VYBERA"
        description="Browse the full VYBERA collection — premium oversized tees, limited drops, and custom streetwear. Free shipping across India."
        keywords="buy oversized tees, streetwear shop India, VYBERA collection, premium tees online, limited edition clothing"
        path="/shop"
        schema={breadcrumbSchema}
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
            <div className="flex items-center gap-2 mb-1">
              {activeFilterParam === 'sale' && (
                <span className="p-1 bg-[#590907] text-[#FAF5ED] text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Flame size={11} /> FESTIVE SALE DROPS
                </span>
              )}
              <p className="text-[#A5A79B] text-[10px] tracking-[0.3em] uppercase font-bold">
                VYBERA CATALOG
              </p>
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-[#30231F] uppercase">
              {activeFilterParam === 'drops'
                ? 'NEW DROPS'
                : activeFilterParam === 'sale'
                ? 'FESTIVE SALE'
                : selectedCategory !== 'all'
                ? `${selectedCategory} COLLECTION`
                : 'ALL COLLECTIONS'}
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
              onClick={() => setFilterOpen((o) => !o)}
              className="btn-secondary !py-2 !px-4 text-xs font-bold tracking-wider uppercase"
            >
              <SlidersHorizontal size={14} />
              {filterOpen ? 'Hide Filters' : 'Filter Products'}
            </button>
            <span className="text-[#7A6E69] text-xs font-semibold">
              {filtered.length} products
            </span>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <motion.div
          initial={false}
          animate={{ height: filterOpen ? 'auto' : 0, opacity: filterOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-white border border-[#E5DACD] shadow-sm mb-6">
            {/* Category filter */}
            <div>
              <p className="text-[#590907] text-[11px] font-bold tracking-widest uppercase mb-3">
                Category
              </p>
              <div className="flex flex-col gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setActiveFilterParam('');
                    }}
                    className={`text-left text-xs font-semibold py-1 transition-colors ${
                      selectedCategory === cat.value
                        ? 'text-[#590907] font-black'
                        : 'text-[#7A6E69] hover:text-[#30231F]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size filter */}
            <div>
              <p className="text-[#590907] text-[11px] font-bold tracking-widest uppercase mb-3">
                Available Size
              </p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
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
              <p className="text-[#590907] text-[11px] font-bold tracking-widest uppercase mb-3">
                Price Range
              </p>
              <div className="flex flex-col gap-1.5">
                {PRICE_RANGES.map((range, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPrice(i)}
                    className={`text-left text-xs font-semibold py-1 transition-colors ${
                      selectedPrice === i
                        ? 'text-[#590907] font-black'
                        : 'text-[#7A6E69] hover:text-[#30231F]'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid: 2 columns mobile, 4 columns desktop */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-[#F3E7D8] border border-[#E5DACD] animate-pulse"
                />
              ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[#E5DACD] p-8">
            <p className="text-[#7A6E69] text-sm tracking-widest uppercase mb-4">
              No products match your selected filters
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-outline text-xs !py-3 !px-6"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
