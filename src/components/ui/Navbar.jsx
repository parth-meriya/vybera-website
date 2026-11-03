import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  Package,
  Tag,
  Award,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../firebase/auth';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const { itemCount } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Read wishlist count from localStorage
    const updateWishCount = () => {
      try {
        const local = JSON.parse(localStorage.getItem('vy_wishlist') || '[]');
        setWishlistCount(Array.isArray(local) ? local.length : 0);
      } catch {
        setWishlistCount(0);
      }
    };

    updateWishCount();
    window.addEventListener('storage', updateWishCount);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('storage', updateWishCount);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logOut();
    toast.success('Signed out.', { className: 'toast-vybera' });
    navigate('/');
    setUserMenuOpen(false);
  };

  // Primary navigation specified by user:
  // - New Drops
  // - Collections
  // - Customize
  // - Sale
  const primaryNavLinks = [
    { label: 'New Drops', to: '/new-drops', badge: 'NEW' },
    { label: 'Collections', to: '/collections' },
    { label: 'Customize', to: '/customize', badge: 'USP' },
    { label: 'Sale', to: '/sale', isSale: true },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin', isAdmin: true }] : []),
  ];

  const profileLinks = [
    { label: 'My Orders', to: '/dashboard/orders', icon: Package },
    { label: 'Wishlist', to: '/dashboard/wishlist', icon: Heart },
    { label: 'Coupons', to: '/dashboard/coupons', icon: Tag },
    { label: 'Rewards', to: '/dashboard/rewards', icon: Award },
    { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
    { label: 'Account Settings', to: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF5ED]/95 navbar-blur border-b border-vy-border-light shadow-sm py-3'
            : 'bg-gradient-to-b from-[#30231F]/70 via-[#30231F]/30 to-transparent py-4 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group tracking-[0.35em] uppercase font-display font-black text-xl md:text-2xl transition-transform active:scale-95"
          >
            <span
              className={`transition-colors ${
                scrolled ? 'text-vy-text group-hover:text-vy-burgundy' : 'text-[#FAF5ED]'
              }`}
            >
              VYBERA
            </span>
          </Link>

          {/* Desktop Primary Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {primaryNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative text-xs font-bold tracking-[0.2em] uppercase transition-all duration-200 py-1 flex items-center gap-1.5 ${
                    link.isSale
                      ? scrolled
                        ? 'text-vy-burgundy hover:text-vy-burgundy-hover font-black'
                        : 'text-amber-300 hover:text-amber-200 font-black'
                      : isActive
                      ? scrolled
                        ? 'text-vy-burgundy font-black'
                        : 'text-white font-black'
                      : scrolled
                      ? 'text-vy-text/80 hover:text-vy-burgundy'
                      : 'text-[#FAF5ED]/80 hover:text-white'
                  }`
                }
              >
                {link.isSale && <Flame size={12} className="text-vy-burgundy" />}
                {link.label}
                {link.badge && !link.isSale && (
                  <span className="text-[8px] px-1 py-0.2 bg-vy-burgundy/10 text-vy-burgundy rounded font-extrabold tracking-normal">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wishlist Icon */}
            <Link
              to="/dashboard/wishlist"
              aria-label="Wishlist"
              className={`p-2 transition-colors relative ${
                scrolled
                  ? 'text-vy-text hover:text-vy-burgundy'
                  : 'text-[#FAF5ED] hover:text-white'
              }`}
            >
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-vy-burgundy text-[#FAF5ED] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              aria-label="Shopping Bag"
              className={`p-2 transition-colors relative ${
                scrolled
                  ? 'text-vy-text hover:text-vy-burgundy'
                  : 'text-[#FAF5ED] hover:text-white'
              }`}
            >
              <ShoppingBag size={19} />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-vy-burgundy text-[#FAF5ED] text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-label="User Account"
                className={`p-2 transition-colors flex items-center gap-1 ${
                  scrolled
                    ? 'text-vy-text hover:text-vy-burgundy'
                    : 'text-[#FAF5ED] hover:text-white'
                }`}
              >
                <User size={19} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#FAF5ED] border border-vy-border-light shadow-xl py-2 z-50 text-vy-text"
                  >
                    {user ? (
                      <div>
                        {/* User Header */}
                        <div className="px-4 py-2 border-b border-vy-border-light/70 mb-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-[#75665C]">
                            Account
                          </p>
                          <p className="text-xs font-semibold text-vy-text truncate">
                            {user.displayName || user.email || 'VYBERA Member'}
                          </p>
                        </div>

                        {/* Profile Links */}
                        {profileLinks.map(({ label, to, icon: Icon }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-vy-text hover:text-vy-burgundy hover:bg-vy-cream/60 transition-colors"
                          >
                            <Icon size={14} className="text-[#75665C]" />
                            {label}
                          </Link>
                        ))}

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-vy-burgundy hover:bg-vy-burgundy/10 transition-colors border-t border-vy-border-light/70 mt-1"
                          >
                            <Sparkles size={14} />
                            Admin Console
                          </Link>
                        )}

                        <div className="border-t border-vy-border-light/70 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors text-left"
                          >
                            <LogOut size={14} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        <Link
                          to="/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="block text-center py-2 bg-vy-burgundy text-[#FFFFFF] text-xs font-bold tracking-widest uppercase hover:bg-vy-burgundy-hover"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setUserMenuOpen(false)}
                          className="block text-center py-2 text-xs font-semibold tracking-wider text-vy-text hover:text-vy-burgundy"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle Menu"
              className={`md:hidden p-2 transition-colors ${
                scrolled
                  ? 'text-vy-text hover:text-vy-burgundy'
                  : 'text-[#FAF5ED] hover:text-white'
              }`}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Fullscreen Editorial Drawer ─────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-0 z-40 bg-[#FAF5ED] pt-20 px-6 pb-8 flex flex-col justify-between overflow-y-auto md:hidden text-vy-text"
          >
            {/* Primary Nav Links */}
            <div className="space-y-6 pt-4">
              <p className="text-[10px] tracking-[0.3em] font-bold uppercase text-[#75665C]">
                Navigation
              </p>
              <div className="space-y-4">
                {primaryNavLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between text-2xl font-display font-bold uppercase tracking-wider transition-colors ${
                        link.isSale
                          ? 'text-vy-burgundy'
                          : isActive
                          ? 'text-vy-burgundy'
                          : 'text-vy-text hover:text-vy-burgundy'
                      }`
                    }
                  >
                    <span className="flex items-center gap-2">
                      {link.isSale && <Flame size={20} className="text-vy-burgundy" />}
                      {link.label}
                    </span>
                    <ChevronRight size={18} className="text-[#75665C]" />
                  </NavLink>
                ))}
              </div>

              {/* Quick Account Links in Profile Drawer */}
              <div className="pt-6 border-t border-vy-border-light space-y-3">
                <p className="text-[10px] tracking-[0.3em] font-bold uppercase text-[#75665C]">
                  My Profile & Preferences
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {profileLinks.map(({ label, to, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className="p-3 bg-white border border-vy-border-light text-xs font-medium text-vy-text flex items-center gap-2 hover:border-vy-burgundy"
                    >
                      <Icon size={14} className="text-vy-burgundy" />
                      <span className="truncate">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-vy-border-light space-y-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 text-center text-xs font-bold tracking-widest uppercase border border-rose-300 text-rose-700 bg-rose-50"
                >
                  Sign Out ({user.displayName || user.email})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary !py-3 text-center text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary !py-3 text-center text-xs"
                  >
                    Register
                  </Link>
                </div>
              )}

              <p className="text-[10px] text-center tracking-[0.25em] uppercase text-[#75665C] pt-2">
                VYBERA — THE ERA OF VIBES
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
