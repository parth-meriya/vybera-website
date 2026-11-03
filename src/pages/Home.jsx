import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Flame,
  Sparkles,
  ShoppingBag,
  Shirt,
  Users,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { getFeaturedProducts, getDropProducts, getProducts } from '../firebase/products';
import { getDiwaliCampaign, isCampaignActive, DEFAULT_DIWALI_CAMPAIGN } from '../firebase/diwaliCampaign';
import { getShoppableVideos, DEFAULT_SHOPPABLE_VIDEOS } from '../firebase/shoppableVideos';
import CountdownTimer from '../components/ui/CountdownTimer';
import SEO from '../components/SEO';

// Curated fallback streetwear products if Firestore has none yet
const FALLBACK_PRODUCTS = [
  {
    id: 'prod_raw_obsidian',
    name: 'Raw Obsidian Heavyweight Oversized Tee',
    price: 999,
    compareAtPrice: 1499,
    category: 'Oversized',
    isDrop: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image: '/Design/7th%20boy/ChatGPT%20Image%20May%204,%202026,%2010_07_57%20AM.png',
    images: ['/Design/7th%20boy/ChatGPT%20Image%20May%204,%202026,%2010_07_57%20AM.png'],
    inStock: true,
  },
  {
    id: 'prod_burgundy_shadow',
    name: 'Burgundy Shadow Boxy Cut Tee',
    price: 1099,
    compareAtPrice: 1699,
    category: 'Oversized',
    isDrop: true,
    sizes: ['M', 'L', 'XL'],
    image: '/Design/6th%20girl/ChatGPT%20Image%20May%204,%202026,%2009_39_33%20AM.png',
    images: ['/Design/6th%20girl/ChatGPT%20Image%20May%204,%202026,%2009_39_33%20AM.png'],
    inStock: true,
  },
  {
    id: 'prod_vintage_sage',
    name: 'Sage Dust Drop-Shoulder Tee',
    price: 899,
    compareAtPrice: 1299,
    category: 'Oversized',
    isDrop: false,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/Design/8th%20boy/ChatGPT%20Image%20May%204,%202026,%2011_13_19%20PM.png',
    images: ['/Design/8th%20boy/ChatGPT%20Image%20May%204,%202026,%2011_13_19%20PM.png'],
    inStock: true,
  },
  {
    id: 'prod_couple_duality',
    name: 'Duality Couple Edition Tee',
    price: 1899,
    compareAtPrice: 2499,
    category: 'Couple',
    isDrop: true,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/Design/couple/ChatGPT%20Image%20May%204,%202026,%2010_42_48%20AM.png',
    images: ['/Design/couple/ChatGPT%20Image%20May%204,%202026,%2010_42_48%20AM.png'],
    inStock: true,
  },
  {
    id: 'prod_monochrome_core',
    name: 'Core Heavyweight Oversized Tee — Bone White',
    price: 899,
    compareAtPrice: 1399,
    category: 'Oversized',
    isDrop: false,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image: '/Design/5th%20boy/ChatGPT%20Image%20May%204,%202026,%2009_33_04%20AM.png',
    images: ['/Design/5th%20boy/ChatGPT%20Image%20May%204,%202026,%2009_33_04%20AM.png'],
    inStock: true,
  },
  {
    id: 'prod_rebel_typography',
    name: 'Vybera Studio Graphic Oversized Tee',
    price: 999,
    compareAtPrice: 1599,
    category: 'Oversized',
    isDrop: true,
    sizes: ['M', 'L', 'XL'],
    image: '/Design/Third%20Girl%20typography/ChatGPT%20Image%20May%204,%202026,%2009_14_58%20AM.png',
    images: ['/Design/Third%20Girl%20typography/ChatGPT%20Image%20May%204,%202026,%2009_14_58%20AM.png'],
    inStock: true,
  },
];

const Home = () => {
  const [campaign, setCampaign] = useState(DEFAULT_DIWALI_CAMPAIGN);
  const [drops, setDrops] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shoppable Video Modal / Active State
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    // Parallel fetching for ultra-fast initial render
    Promise.all([
      getDiwaliCampaign().catch(() => DEFAULT_DIWALI_CAMPAIGN),
      getDropProducts().catch(() => []),
      getFeaturedProducts().catch(() => []),
      getProducts().catch(() => []),
      getShoppableVideos().catch(() => DEFAULT_SHOPPABLE_VIDEOS),
    ])
      .then(([camp, dropList, featList, allProds, vidList]) => {
        setCampaign(camp);

        // Populate drops
        if (dropList && dropList.length > 0) {
          setDrops(dropList.slice(0, 4));
        } else if (allProds && allProds.length > 0) {
          setDrops(allProds.slice(0, 4));
        } else {
          setDrops(FALLBACK_PRODUCTS.slice(0, 4));
        }

        // Populate bestsellers (4-6 products)
        if (featList && featList.length >= 4) {
          setBestsellers(featList.slice(0, 6));
        } else if (allProds && allProds.length >= 4) {
          setBestsellers(allProds.slice(0, 6));
        } else {
          setBestsellers(FALLBACK_PRODUCTS.slice(0, 6));
        }

        setVideos(vidList && vidList.length > 0 ? vidList : DEFAULT_SHOPPABLE_VIDEOS);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Home data load error:', err);
        setDrops(FALLBACK_PRODUCTS.slice(0, 4));
        setBestsellers(FALLBACK_PRODUCTS.slice(0, 6));
        setVideos(DEFAULT_SHOPPABLE_VIDEOS);
        setLoading(false);
      });
  }, []);

  const diwaliActive = isCampaignActive(campaign);

  // Marquee editorial slogan
  const marqueeText =
    '— 240+ GSM HEAVYWEIGHT COTTON — DROP SHOULDER BOXY SILHOUETTE — BESPOKE CUSTOM PRINTING — THE ERA OF VIBES — ENGINEERED IN INDIA — LIMITED FESTIVE DROPS — ';

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'VYBERA',
    url: 'https://vybera.shop',
    logo: 'https://vybera.shop/favicon.png',
    description:
      'VYBERA — The Era of Vibes. Premium oversized streetwear and custom printing in India.',
    sameAs: ['https://www.instagram.com/vybera.shop'],
  };

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#30231F] overflow-hidden">
      <SEO
        title="VYBERA — The Era of Vibes | Premium Oversized Streetwear & Custom Drops"
        description="Shop luxury oversized T-shirts, Diwali drops, and custom-printed streetwear crafted from 240+ GSM heavyweight cotton. Made in India."
        keywords="VYBERA, oversized t-shirt, streetwear india, custom t-shirt printing, diwali streetwear sale, luxury streetwear, boxy fit tee"
        path="/"
        schema={orgSchema}
      />

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — DIWALI SALE HERO / CAMPAIGN BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] md:min-h-screen flex items-center bg-[#30231F] text-[#FAF5ED] overflow-hidden">
        {/* Parallax / Responsive Image Background */}
        <div className="absolute inset-0 z-0">
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet={campaign.mobileBannerUrl || '/banners/diwali_sale_banner_mobile.png'}
            />
            <img
              src={campaign.desktopBannerUrl || '/banners/diwali_sale_banner.png'}
              alt="VYBERA Diwali Fashion Campaign"
              fetchpriority="high"
              decoding="async"
              className="w-full h-full object-cover object-center md:object-[68%_center] opacity-75"
              onError={(e) => {
                if (e.target.src.includes('diwali_sale_banner.png')) return;
                e.target.src = '/banners/diwali_sale_banner.png';
              }}
            />
          </picture>

          {/* Luxury Editorial Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1E1614] via-[#1E1614]/85 md:via-[#1E1614]/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-[#590907]/20 mix-blend-multiply z-10 pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 w-full pt-28 pb-16 flex flex-col items-start justify-center">
          {/* Eyebrow / Campaign Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#590907] text-[#FAF5ED] text-[10px] md:text-xs font-black tracking-[0.3em] uppercase shadow-lg">
              {diwaliActive ? (
                <>
                  <Flame size={13} className="text-amber-300" />
                  {campaign.badgeText || 'DIWALI FESTIVE EDITION'}
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-[#E8D2B5]" />
                  VYBERA ESSENTIALS
                </>
              )}
            </span>
            <span className="h-px w-10 bg-[#E8D2B5]/50 hidden sm:block" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#E8D2B5] font-semibold hidden sm:inline-block">
              THE ERA OF VIBES
            </span>
          </motion.div>

          {/* Large Bold Editorial Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] leading-[0.98] tracking-tight uppercase text-[#FAF5ED] mb-6 max-w-3xl"
          >
            {diwaliActive ? (
              campaign.headline || 'DIWALI VIBES. BIGGER DROPS. BETTER DEALS.'
            ) : (
              <>
                THE ERA OF
                <br />
                <span className="text-[#E8D2B5]">VIBES.</span>
              </>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xs sm:text-sm md:text-base text-[#F3E7D8]/90 uppercase tracking-[0.2em] leading-relaxed mb-8 max-w-xl font-medium"
          >
            {diwaliActive
              ? campaign.subtitle ||
                'Celebrate the festival of lights with your favourite VYBERA fits.'
              : 'Heavyweight oversized streetwear engineered for those who shape what’s next.'}
          </motion.p>

          {/* Optional Admin-Managed Countdown Timer */}
          {diwaliActive && campaign.showCountdown && campaign.endDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <CountdownTimer
                endDate={campaign.endDate}
                campaignName={campaign.badgeText || 'DIWALI SALE'}
              />
            </motion.div>
          )}

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
          >
            <Link
              to={diwaliActive && campaign.ctaLink ? campaign.ctaLink : '/shop'}
              className="px-10 py-4 bg-[#590907] text-[#FAF5ED] text-xs font-bold tracking-[0.25em] uppercase hover:bg-[#430605] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 text-center"
            >
              {diwaliActive ? campaign.ctaText || 'SHOP DIWALI SALE' : 'SHOP NOW'}
              <ArrowRight size={15} />
            </Link>
            {diwaliActive && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-diwali-spin'))}
                className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B38F26] text-[#30231F] text-xs font-black tracking-[0.25em] uppercase hover:brightness-110 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 text-center border border-[#FFE57F]"
              >
                <Sparkles size={14} className="text-[#590907]" />
                Spin & Win ✨
              </button>
            )}
            <Link
              to="/customize"
              className="px-8 py-4 bg-[#FAF5ED]/10 backdrop-blur-md border border-[#FAF5ED]/30 text-[#FAF5ED] text-xs font-bold tracking-[0.25em] uppercase hover:bg-[#FAF5ED] hover:text-[#30231F] transition-all duration-300 flex items-center justify-center gap-2 text-center"
            >
              Custom Studio
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#E8D2B5]">Scroll</span>
          <ChevronDown size={14} className="animate-bounce text-[#E8D2B5]" />
        </div>
      </section>

      {/* ── Editorial Streetwear Marquee ────────────────────────────── */}
      <div className="bg-[#1E1614] border-y border-[#30231F] py-3.5 overflow-hidden">
        <div className="marquee-content text-[#E8D2B5] text-xs tracking-[0.4em] font-bold uppercase whitespace-nowrap">
          {marqueeText}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — NEW DROP
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-pad bg-[#FAF5ED]">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-[#E5DACD]">
            <div>
              <div className="flex items-center gap-2 text-[#590907] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#590907] animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                  LIMITED RELEASE
                </span>
              </div>
              <h2 className="font-display font-black text-3xl md:text-5xl tracking-tight uppercase text-[#30231F]">
                NEW DROPS
              </h2>
            </div>
            <Link
              to="/shop?filter=drops"
              className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#590907] hover:text-[#430605] group"
            >
              Shop All Drops{' '}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {/* Product Grid: 2 columns on mobile, 4 columns on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {drops.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — OVERSIZED COLLECTION (Primary Category)
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#F3E7D8] border-y border-[#E5DACD] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Photos (7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] bg-[#FAF5ED] overflow-hidden border border-[#E5DACD] shadow-md group">
              <img
                src="/Design/7th%20boy/ChatGPT%20Image%20May%204,%202026,%2010_13_22%20AM.png"
                alt="VYBERA Oversized Model Silhouette"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = '/hero_banner.png';
                }}
              />
            </div>
            <div className="aspect-[4/5] bg-[#FAF5ED] overflow-hidden border border-[#E5DACD] shadow-md group translate-y-6">
              <img
                src="/Design/6th%20girl/ChatGPT%20Image%20May%204,%202026,%2009_50_38%20AM.png"
                alt="VYBERA Heavyweight Oversized Fit"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = '/hero_banner.png';
                }}
              />
            </div>
          </div>

          {/* Right Column: Category Messaging (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#590907] px-3 py-1 bg-[#E8D2B5] inline-block">
              PRIMARY CATEGORY
            </span>

            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight uppercase leading-[1.05] text-[#30231F]">
              THE OVERSIZED
              <br />
              <span className="text-[#590907]">COLLECTION.</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#75665C] leading-relaxed uppercase tracking-wider font-medium">
              We started VYBERA with one obsession: creating the ultimate oversized T-shirt.
              Engineered with 240+ GSM heavyweight combed cotton, dropped shoulders, and a clean
              boxy drape that stays structured wash after wash.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 pb-4 text-xs">
              <div className="p-3.5 bg-[#FAF5ED] border border-[#E5DACD]">
                <p className="font-bold uppercase text-[#30231F] text-sm">240+ GSM</p>
                <p className="text-[10px] text-[#75665C] uppercase mt-0.5 font-semibold">Heavyweight Combed Cotton</p>
              </div>
              <div className="p-3.5 bg-[#FAF5ED] border border-[#E5DACD]">
                <p className="font-bold uppercase text-[#30231F] text-sm">BOXY FIT</p>
                <p className="text-[10px] text-[#75665C] uppercase mt-0.5 font-semibold">Engineered Drop Shoulder</p>
              </div>
            </div>

            <Link
              to="/shop?category=Oversized"
              className="btn-primary inline-flex !py-4 !px-9 text-xs"
            >
              EXPLORE COLLECTION
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — BEST SELLERS (4–6 Products)
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-pad bg-[#FAF5ED]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-[#E5DACD]">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#75665C] mb-1">
                COMMUNITY FAVORITES
              </p>
              <h2 className="font-display font-black text-3xl md:text-5xl tracking-tight uppercase text-[#30231F]">
                BEST SELLERS
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#590907] hover:text-[#430605] group"
            >
              View Full Catalog{' '}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {/* Clean 4-6 product cards with size selector, wishlist, and quick add */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — CUSTOMIZE YOUR OWN (PRIMARY USP)
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#241916] text-[#FAF5ED] relative overflow-hidden surface-dark">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Headline & USP Intro */}
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <span className="text-[10px] font-black tracking-[0.35em] uppercase text-[#E8D2B5] px-3.5 py-1 bg-white/5 border border-white/10 inline-block">
              OUR PRIMARY USP
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight uppercase text-[#FAF5ED]">
              YOUR DESIGN.
              <br />
              <span className="text-[#E8D2B5]">YOUR VIBE.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#D4BEA5] uppercase tracking-[0.2em] leading-relaxed">
              Upload your artwork or customize fits with high-definition DTF printing, embroidery,
              and streetwear heavyweight blanks.
            </p>
          </div>

          {/* 3 Showcase Pillars: Oversized, Regular, Bulk */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1: Customize Oversized */}
            <div className="p-8 bg-white/5 border border-white/10 hover:border-[#E8D2B5] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="p-3 bg-white/10 text-[#E8D2B5]">
                    <Shirt size={28} />
                  </span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#E8D2B5] bg-white/5 px-2.5 py-1">
                    MOST POPULAR
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl uppercase tracking-wider text-[#FAF5ED] mb-3">
                  CUSTOMIZE OVERSIZED
                </h3>
                <p className="text-xs text-[#D4BEA5] leading-relaxed mb-6">
                  240+ GSM French terry / combed cotton with drop-shoulder streetwear fit. Front,
                  back, or chest print.
                </p>
              </div>
              <Link
                to="/customize?fit=Oversize"
                className="w-full py-3 text-center text-xs font-bold tracking-[0.2em] uppercase bg-[#FAF5ED] text-[#30231F] hover:bg-[#E8D2B5] transition-colors"
              >
                Design Oversized &rarr;
              </Link>
            </div>

            {/* Card 2: Customize Regular */}
            <div className="p-8 bg-white/5 border border-white/10 hover:border-[#E8D2B5] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="p-3 bg-white/10 text-[#E8D2B5]">
                    <Shirt size={28} />
                  </span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4BEA5] bg-white/5 px-2.5 py-1">
                    CLASSIC FIT
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl uppercase tracking-wider text-[#FAF5ED] mb-3">
                  CUSTOMIZE REGULAR
                </h3>
                <p className="text-xs text-[#D4BEA5] leading-relaxed mb-6">
                  180+ GSM 100% bio-washed cotton in timeless standard comfort silhouette. Ideal for
                  daily casual wear.
                </p>
              </div>
              <Link
                to="/customize?fit=Regular"
                className="w-full py-3 text-center text-xs font-bold tracking-[0.2em] uppercase bg-white/10 text-[#FAF5ED] hover:bg-[#FAF5ED] hover:text-[#30231F] transition-colors"
              >
                Design Regular &rarr;
              </Link>
            </div>

            {/* Card 3: Bulk / Group Orders */}
            <div className="p-8 bg-gradient-to-b from-[#590907]/60 to-black/60 border border-[#590907] flex flex-col justify-between group shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="p-3 bg-[#590907] text-[#FAF5ED]">
                    <Users size={28} />
                  </span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 bg-black/40 px-2.5 py-1">
                    TIER DISCOUNTS
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl uppercase tracking-wider text-[#FAF5ED] mb-3">
                  BULK / GROUP ORDERS
                </h3>
                <p className="text-xs text-[#F3E7D8]/80 leading-relaxed mb-6">
                  College fests, startups, teams, and brand merchandise. Minimum 20 pcs with
                  dedicated manager & wholesale pricing.
                </p>
              </div>
              <Link
                to="/customize?tab=bulk"
                className="w-full py-3 text-center text-xs font-bold tracking-[0.2em] uppercase bg-[#590907] text-[#FAF5ED] hover:bg-[#430605] transition-colors"
              >
                Inquire Bulk &rarr;
              </Link>
            </div>
          </div>

          {/* Large Primary CTA */}
          <div className="text-center">
            <Link
              to="/customize"
              className="inline-flex items-center gap-3 px-12 py-4 bg-[#590907] text-[#FAF5ED] font-bold text-xs tracking-[0.25em] uppercase hover:bg-[#430605] transition-all shadow-xl"
            >
              START CUSTOMIZING
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6 — SHOP THE VIBE (Shoppable Videos)
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-pad bg-[#FAF5ED]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-[#E5DACD]">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#590907] mb-1">
                COMMUNITY IN MOTION
              </p>
              <h2 className="font-display font-black text-3xl md:text-5xl tracking-tight uppercase text-[#30231F]">
                SHOP THE VIBE
              </h2>
            </div>
            <p className="text-xs text-[#7A6E69] uppercase tracking-wider max-w-xs">
              Watch real streetwear fits on models and shop or customize the exact design with one click.
            </p>
          </div>

          {/* Video Cards Grid (Optimized loading: thumbnails + click-to-play) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="group flex flex-col bg-white border border-[#E5DACD] overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                {/* Thumbnail Preview Area with Play Button */}
                <div
                  onClick={() => {
                    setActiveVideo(vid);
                    setVideoPlaying(true);
                  }}
                  className="relative aspect-[9/16] bg-stone-900 cursor-pointer overflow-hidden"
                >
                  <img
                    src={vid.thumbnailUrl || '/hero.png'}
                    alt={vid.productName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = '/hero.png';
                    }}
                  />

                  {/* Play Icon Badge */}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                    <span className="w-12 h-12 rounded-full bg-white/90 text-[#590907] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={18} className="translate-x-0.5 fill-current" />
                    </span>
                  </div>

                  {/* Live tag */}
                  <span className="absolute top-2 left-2 text-[9px] font-black tracking-widest uppercase bg-[#590907] text-[#FAF5ED] px-2 py-0.5">
                    SHOPPABLE
                  </span>
                </div>

                {/* Video Info & Instant CTAs */}
                <div className="p-4 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#30231F] truncate group-hover:text-[#590907] transition-colors">
                      {vid.productName}
                    </h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-[#590907] font-bold text-sm">
                        ₹{vid.price?.toLocaleString()}
                      </span>
                      {vid.compareAtPrice && vid.compareAtPrice > vid.price && (
                        <span className="text-xs text-[#A5A79B] line-through">
                          ₹{vid.compareAtPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      to={vid.shopUrl || '/shop'}
                      className="w-full py-2 bg-[#590907] text-[#FAF5ED] text-[10px] font-bold tracking-widest uppercase hover:bg-[#430605] text-center transition-colors"
                    >
                      Shop Now
                    </Link>
                    <Link
                      to={vid.customizeUrl || '/customize'}
                      className="w-full py-2 bg-[#FAF5ED] border border-[#E5DACD] text-[#30231F] text-[10px] font-bold tracking-widest uppercase hover:bg-[#E8D2B5] text-center transition-colors"
                    >
                      Customize This
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Single Active Video Modal (Ensures only 1 video plays at a time) ── */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E1614] text-[#FAF5ED] w-full max-w-sm overflow-hidden border border-white/20 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="absolute top-3 right-3 z-30 p-2 bg-black/60 rounded-full text-white hover:bg-black"
              >
                <X size={18} />
              </button>

              {/* Video Player */}
              <div className="relative aspect-[9/16] bg-black">
                {activeVideo.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={activeVideo.videoUrl}
                    autoPlay
                    loop
                    playsInline
                    muted={videoMuted}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={activeVideo.thumbnailUrl || '/hero.png'}
                    alt={activeVideo.productName}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setVideoMuted((m) => !m)}
                  className="absolute bottom-3 left-3 p-2 bg-black/60 rounded-full text-white hover:bg-black z-20"
                >
                  {videoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* Product Card at bottom of modal */}
              <div className="p-4 bg-[#FAF5ED] text-[#30231F] border-t border-[#E5DACD]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#590907] tracking-wider">
                      Featured Streetwear Fit
                    </p>
                    <h3 className="font-bold text-sm text-[#30231F]">
                      {activeVideo.productName}
                    </h3>
                  </div>
                  <span className="font-black text-base text-[#590907]">
                    ₹{activeVideo.price}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={activeVideo.shopUrl || '/shop'}
                    onClick={() => setActiveVideo(null)}
                    className="btn-primary !py-2.5 text-center text-[10px]"
                  >
                    Shop Now
                  </Link>
                  <Link
                    to={activeVideo.customizeUrl || '/customize'}
                    onClick={() => setActiveVideo(null)}
                    className="btn-secondary !py-2.5 text-center text-[10px]"
                  >
                    Customize
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7 — BRAND STORY
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#F3E7D8] border-t border-[#E5DACD]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <p className="text-[10px] tracking-[0.4em] font-black uppercase text-[#590907]">
            VYBERA MANIFESTO
          </p>

          <h2 className="font-display font-light text-2xl sm:text-4xl md:text-5xl text-[#30231F] leading-tight tracking-wide">
            "Not just clothing.
            <br />
            <span className="font-bold text-[#590907]">A mindset</span> for those who wear the era
            of vibes."
          </h2>

          <p className="text-xs sm:text-sm text-[#75665C] leading-relaxed max-w-xl mx-auto uppercase tracking-wider font-medium">
            Born from underground fashion culture, VYBERA crafts heavyweight oversized silhouettes
            with uncompromising quality. Every piece is an invitation to stand out and define your
            own frequency.
          </p>

          {/* Pillars */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 bg-[#FAF5ED] border border-[#E5DACD]">
              <span className="text-xs font-bold text-[#590907]">01</span>
              <p className="font-bold text-xs uppercase text-[#30231F] mt-1">240+ GSM Cotton</p>
              <p className="text-[10px] text-[#75665C] mt-0.5 font-semibold">Heavyweight durability</p>
            </div>
            <div className="p-4 bg-[#FAF5ED] border border-[#E5DACD]">
              <span className="text-xs font-bold text-[#590907]">02</span>
              <p className="font-bold text-xs uppercase text-[#30231F] mt-1">Boxy Silhouette</p>
              <p className="text-[10px] text-[#75665C] mt-0.5 font-semibold">Engineered drop shoulder</p>
            </div>
            <div className="p-4 bg-[#FAF5ED] border border-[#E5DACD]">
              <span className="text-xs font-bold text-[#590907]">03</span>
              <p className="font-bold text-xs uppercase text-[#30231F] mt-1">Bespoke Studio</p>
              <p className="text-[10px] text-[#75665C] mt-0.5 font-semibold">High-definition printing</p>
            </div>
            <div className="p-4 bg-[#FAF5ED] border border-[#E5DACD]">
              <span className="text-xs font-bold text-[#590907]">04</span>
              <p className="font-bold text-xs uppercase text-[#30231F] mt-1">Made in India</p>
              <p className="text-[10px] text-[#75665C] mt-0.5 font-semibold">Crafted with precision</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
