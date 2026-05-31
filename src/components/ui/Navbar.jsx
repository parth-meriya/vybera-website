import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../firebase/auth';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [dynamicLinks, setDynamicLinks] = useState([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    
    // Fetch dynamic sections for navbar
    import('../../firebase/sections').then(({ getSections }) => {
      getSections().then(sections => {
        const visible = sections.filter(s => s.visible).map(s => ({
          label: s.label,
          to: s.path
        }));
        setDynamicLinks(visible);
      });
    });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logOut();
    toast.success('Signed out.', { className: 'toast-vybera' });
    navigate('/');
    setUserMenuOpen(false);
  };

  const staticLinks = [
    { label: 'Customize', to: '/customize' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : []),
  ];

  const navLinks = [...dynamicLinks, ...staticLinks];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#1C2A21]/95 navbar-blur border-b border-vy-border/30'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-display font-bold text-xl tracking-[0.3em] text-vy-white">
            VYBERA
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-xs font-medium tracking-widest uppercase transition-colors duration-300 ${
                    isActive ? 'text-vy-accent' : 'text-vy-light hover:text-vy-accent'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-vy-grey hover:text-vy-white transition-colors">
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-vy-white text-vy-black text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </Link>

            {/* User */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="p-2 text-vy-grey hover:text-vy-white transition-colors"
              >
                <User size={18} />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-vy-card border border-vy-border py-1"
                  >
                    {user ? (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-xs text-vy-grey hover:text-vy-white hover:bg-vy-border transition-colors"
                        >
                          My Profile
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-xs text-vy-grey hover:text-vy-white hover:bg-vy-border transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-xs text-vy-grey hover:text-vy-white hover:bg-vy-border transition-colors"
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 text-vy-grey hover:text-vy-white transition-colors"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-40 bg-vy-black pt-16 px-6 flex flex-col gap-6 md:hidden"
          >
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `text-2xl font-display font-light tracking-widest uppercase transition-colors ${
                    isActive ? 'text-vy-white' : 'text-vy-grey'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="border-t border-vy-border pt-6 flex flex-col gap-4">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-vy-white text-sm tracking-widest uppercase">
                    My Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-vy-grey text-sm tracking-widest uppercase">Sign In</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="text-vy-grey text-sm tracking-widest uppercase">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
