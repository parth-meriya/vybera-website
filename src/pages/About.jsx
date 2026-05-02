import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SEO from '../components/SEO';

const About = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'content', 'about')).then(snap => {
      if (snap.exists()) setContent(snap.data().text || '');
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-vy-black pt-16">
      <SEO
        title="About Us"
        description="VYBERA — born from an obsession with forward-thinking clothing. Learn about our story, values, and why we craft premium oversized streetwear."
        keywords="about VYBERA, streetwear brand story, Indian fashion brand, premium clothing brand, VYBERA mission"
        path="/about"
      />
      {/* Hero */}
      <section className="relative h-[60vh] overflow-hidden flex items-end pb-16 border-b border-vy-border">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-vy-black z-10" />
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
          alt="About VYBERA"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-20 max-w-screen-xl mx-auto px-6 md:px-12 w-full">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-vy-grey text-xs tracking-[0.5em] uppercase mb-3"
          >
            Our Story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display font-bold text-5xl md:text-7xl tracking-wider text-vy-white"
          >
            ABOUT
          </motion.h1>
        </div>
      </section>

      {/* Content */}
      <section className="section-pad">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-4 bg-vy-card rounded animate-pulse" style={{ width: i % 3 === 0 ? '60%' : '100%' }} />
              ))}
            </div>
          ) : content ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-vy-light text-base leading-relaxed whitespace-pre-wrap"
            >
              {content}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-vy-light text-base leading-relaxed"
            >
              <p>
                VYBERA was born from a simple obsession: clothing that feels as forward-thinking as the people who wear it. We exist at the intersection of minimalism and futurism — crafting oversized silhouettes that transcend trend cycles.
              </p>
              <p>
                Every piece in our collection is designed with intention. The weight of the fabric, the precision of the drop shoulder, the placement of every graphic — nothing is incidental. We make clothes for those who understand that what you wear is a conversation before you even speak.
              </p>
              <p>
                Our drops are limited. Our standards are not. Each collection is produced in small batches to ensure quality and exclusivity. When a drop ends, it ends — no restocks, no compromises.
              </p>
              <p className="text-vy-white font-medium text-lg">
                Wear the Next. Always.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Values */}
      <section className="section-pad border-t border-vy-border">
        <div className="max-w-screen-xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display font-bold text-3xl tracking-wider text-vy-white text-center mb-16"
          >
            THE CODE
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Quality First', desc: 'Premium 100% cotton. Every stitch, every wash, every season.' },
              { num: '02', title: 'Limited Always', desc: 'No mass production. No restock. Own what few others have.' },
              { num: '03', title: 'Future Forward', desc: 'Design rooted in tomorrow. Minimalism without sacrifice.' },
            ].map(({ num, title, desc }) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="border border-vy-border p-8"
              >
                <p className="text-vy-border font-display font-bold text-5xl mb-6">{num}</p>
                <h3 className="text-vy-white font-semibold text-lg tracking-wide mb-3">{title}</h3>
                <p className="text-vy-grey text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
