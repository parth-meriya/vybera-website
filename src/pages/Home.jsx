import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { getProducts } from '../firebase/products';
import SEO from '../components/SEO';


const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    getProducts().then(p => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const featured = products.filter(p => p.featured).slice(0, 4);
  const drops = products.filter(p => p.isDrop).slice(0, 4);

  // Marquee text
  const marqueeText = '— REDEFINING LUXURY STREETWEAR — UNCOMPROMISED FIT — ENGINEERED FOR THE BOLD — PREMIUM HEAVYWEIGHT COTTON — MINIMALIST AESTHETIC — DESIGNED TO STAND OUT — ';

  return (
    <div className="min-h-screen bg-vy-dark">
      <SEO
        title="Premium Oversized Streetwear"
        description="VYBERA — Premium oversized streetwear for those who define the next. Shop limited drops, couple tees, custom designs, and embroidery. Made in India."
        keywords="VYBERA, streetwear, oversized tees, premium clothing, Indian streetwear, couple tees, custom tees, embroidery, limited drops, fashion brand India, buy streetwear online"
        path="/"
      />



      {/* ─── HERO ─────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen overflow-hidden flex items-center bg-[#1C2A21]">
        {/* Parallax BG */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C2A21]/95 via-[#1C2A21]/60 to-transparent z-10" />
          <img
            src="/hero_banner.png"
            alt="VYBERA Collection"
            className="w-full h-full object-cover object-center md:object-[70%_center]"
          />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-20 px-8 md:px-24 flex flex-col items-start w-full max-w-4xl"
        >
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-4 mb-6"
          >
            <span className="text-vy-light text-[11px] tracking-[0.5em] uppercase font-medium">
              New Collection
            </span>
            <span className="w-12 h-px bg-vy-accent" />
            <span className="text-vy-accent text-sm">✦</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] tracking-[0.05em] text-vy-white leading-[0.95] mb-6"
          >
              <>
                BUILT FOR<br />
                <span className="text-vy-accent">THE FUTURE</span>
              </>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-vy-light text-sm md:text-base leading-relaxed mb-10 max-w-md"
          >
            Premium comfort. Timeless style.<br />Made for the next generation.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link 
              to="/shop" 
              className="group inline-flex items-center gap-4 px-10 py-4 bg-vy-accent text-vy-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 transition-all duration-300"
            >
              Shop Now
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <span className="text-vy-light/50 text-[10px] tracking-[0.4em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronDown size={16} className="text-vy-light/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── MARQUEE ─────────────────────────────────── */}
      <div className="bg-vy-black border-y border-vy-border/30 py-4 overflow-hidden">
        <div className="marquee-content text-vy-light/60 text-xs tracking-[0.4em] font-medium whitespace-nowrap">
          {marqueeText}
        </div>
      </div>

      {/* ─── FEATURED ────────────────────────────────── */}
      <section className="section-pad">
        <div className="max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <p className="text-vy-grey text-xs tracking-[0.5em] uppercase mb-2">Collection</p>
              <h2 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white">
                FEATURED
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors"
            >
              View All <ArrowRight size={14} />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-vy-card border border-vy-border animate-pulse" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link to="/shop" className="btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      {/* ─── FULL WIDTH BANNER ───────────────────────── */}
      <section className="relative h-[50vh] overflow-hidden border-y border-vy-border/30">
        <div className="absolute inset-0 bg-[#1C2A21]/85 z-10" />
        <img
          src="/hero_banner.png"
          alt="VYBERA Collection"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.5em' }}
            whileInView={{ opacity: 1, letterSpacing: '0.8em' }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-vy-accent text-xs uppercase tracking-[0.8em] mb-4"
          >
            The Era of Vibes
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display font-bold text-4xl md:text-6xl tracking-wider text-vy-white"
          >
            CUSTOMIZE<br /><span className="text-vy-accent">YOUR VIBES</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <Link to="/customize" className="btn-outline">Start Designing</Link>
          </motion.div>
        </div>
      </section>

      {/* ─── LIMITED DROP ────────────────────────────── */}
      <section id="drops" className="section-pad">
        <div className="max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-vy-grey text-xs tracking-[0.5em] uppercase">Limited</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white">
                DROP 01
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors"
            >
              Shop The Drop <ArrowRight size={14} />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-vy-card border border-vy-border animate-pulse" />
              ))}
            </div>
          ) : drops.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {drops.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-vy-grey text-sm tracking-widest uppercase">Drop Coming Soon</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/shop" className="btn-outline">
              Shop The Drop
            </Link>
          </div>
        </div>
      </section>

      {/* ─── BRAND STATEMENT ─────────────────────────── */}
      <section className="section-pad border-t border-vy-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="font-display font-light text-3xl md:text-5xl text-vy-white leading-tight tracking-wide"
          >
            "Not just clothing.<br />
            <span className="text-vy-grey">A mindset for those</span><br />
            who wear the next era."
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 h-px bg-vy-border max-w-xs mx-auto"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
