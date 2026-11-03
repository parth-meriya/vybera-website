import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

const InstagramIcon = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#241916] text-[#FAF5ED] pt-16 pb-12 px-6 md:px-12 border-t border-[#30231F] surface-dark">
      <div className="max-w-7xl mx-auto">
        {/* Top Trust Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-white/10 text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/5 text-[#E8D2B5] rounded">
              <Truck size={18} />
            </span>
            <div>
              <p className="font-bold uppercase tracking-wider text-[#FAF5ED]">PAN-INDIA EXPRESS SHIPPING</p>
              <p className="text-[11px] text-[#D4BEA5] mt-0.5">Fast dispatches with real-time SMS & tracking.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/5 text-[#E8D2B5] rounded">
              <RefreshCw size={18} />
            </span>
            <div>
              <p className="font-bold uppercase tracking-wider text-[#FAF5ED]">EASY SIZE EXCHANGES</p>
              <p className="text-[11px] text-[#D4BEA5] mt-0.5">Hassle-free 7-day size swap guarantee.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/5 text-[#E8D2B5] rounded">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="font-bold uppercase tracking-wider text-[#FAF5ED]">100% SECURE PAYMENTS</p>
              <p className="text-[11px] text-[#D4BEA5] mt-0.5">Encrypted UPI, Cards & NetBanking via Razorpay.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-14 border-b border-white/10">
          {/* Brand Manifesto (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="font-display font-black text-2xl tracking-[0.35em] uppercase text-[#FAF5ED]">
              VYBERA
            </h3>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E8D2B5]">
              THE ERA OF VIBES
            </p>
            <p className="text-xs text-[#D4BEA5] leading-relaxed max-w-sm">
              Premium oversized streetwear and custom apparel engineered for those who set culture. Heavyweight combed cotton, precision silhouettes, and high-definition bespoke printing. Made in India.
            </p>

            {/* Direct Connect Buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="https://wa.me/917574097366"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs font-semibold tracking-wider hover:bg-emerald-900/80 transition-colors"
              >
                <MessageCircle size={14} />
                WhatsApp: +91 75740 97366
              </a>
              <a
                href="https://www.instagram.com/vybera.shop"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 text-[#FAF5ED] text-xs font-semibold tracking-wider hover:bg-white/10 transition-colors"
              >
                <InstagramIcon size={14} />
                @vybera.shop
              </a>
            </div>
          </div>

          {/* Quick Shop Links (2 Cols) */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold tracking-[0.25em] uppercase text-[#E8D2B5] mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/shop?filter=drops" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  New Drops
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  Oversized Collection
                </Link>
              </li>
              <li>
                <Link to="/customize" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  Customize Your Own
                </Link>
              </li>
              <li>
                <Link to="/shop?filter=sale" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  Festive Sale Drops
                </Link>
              </li>
              <li>
                <Link to="/customize?tab=bulk" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  Bulk & Group Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Brand & Support (2 Cols) */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold tracking-[0.25em] uppercase text-[#E8D2B5] mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/about" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/dashboard/orders" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-[#FAF5ED]/80 hover:text-white transition-colors">
                  Customer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Mandatory Legal & Policies (3 Cols) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold tracking-[0.25em] uppercase text-[#E8D2B5] mb-4">
              Customer Policies
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/shipping-policy" className="text-[#FAF5ED]/80 hover:text-white transition-colors flex items-center justify-between">
                  Shipping Policy <ArrowUpRight size={12} className="opacity-40" />
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-[#FAF5ED]/80 hover:text-white transition-colors flex items-center justify-between">
                  Return & Cancellation Policy <ArrowUpRight size={12} className="opacity-40" />
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-[#FAF5ED]/80 hover:text-white transition-colors flex items-center justify-between">
                  Privacy Policy <ArrowUpRight size={12} className="opacity-40" />
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#FAF5ED]/80 hover:text-white transition-colors flex items-center justify-between">
                  Terms & Conditions <ArrowUpRight size={12} className="opacity-40" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#D4BEA5]">
          <p>© {year} VYBERA. ALL RIGHTS RESERVED. CRAFTED IN INDIA.</p>
          <p className="tracking-widest uppercase text-[#E8D2B5] font-semibold">
            THE ERA OF VIBES.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
