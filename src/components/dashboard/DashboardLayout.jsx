import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Heart, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  Award,
  MapPin,
  Gift,
  Ticket,
  Bell,
  Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../firebase/auth';
import toast from 'react-hot-toast';
import BackButton from '../ui/BackButton';

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'My Orders', path: '/dashboard/orders', icon: Package },
  { name: 'Custom Designs', path: '/dashboard/custom-designs', icon: Palette },
  { name: 'Rewards', path: '/dashboard/rewards', icon: Award },
  { name: 'Wishlist', path: '/dashboard/wishlist', icon: Heart },
  { name: 'Address Book', path: '/dashboard/addresses', icon: MapPin },
  { name: 'Coupons', path: '/dashboard/coupons', icon: Gift },
  { name: 'Campaign Rewards', path: '/dashboard/campaign-rewards', icon: Ticket },
  { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  { name: 'Security', path: '/dashboard/security', icon: ShieldCheck },
];

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Signed out successfully', { className: 'toast-vybera' });
      navigate('/');
    } catch (err) {
      toast.error('Failed to log out', { className: 'toast-vybera' });
    }
  };

  return (
    <div className="min-h-screen bg-vy-black text-vy-white pt-24 pb-16 font-sans flex flex-col md:flex-row">
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex justify-between items-center px-6 pb-6 border-b border-vy-border">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="font-display font-bold text-xl tracking-widest uppercase">My Profile</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-vy-white hover:text-vy-accent transition-colors">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <motion.aside 
        initial={false}
        animate={{ height: isMobileMenuOpen ? 'auto' : 0, opacity: isMobileMenuOpen ? 1 : 0 }}
        className={`md:!h-auto md:!opacity-100 overflow-hidden md:overflow-visible md:w-64 shrink-0 px-6 md:px-8 py-4 md:py-8 border-r-0 md:border-r border-vy-border ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}
      >
        <div className="hidden md:block mb-8">
          <div className="mb-6">
            <BackButton />
          </div>
          <p className="text-vy-grey text-[10px] tracking-widest uppercase mb-2">Welcome Back</p>
          <p className="font-display font-bold text-lg truncate">{user?.displayName || 'VYBERA Member'}</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-none text-xs tracking-widest uppercase transition-all duration-300 border-l-2 ${
                  isActive 
                    ? 'border-vy-accent bg-vy-border/20 text-vy-white font-bold' 
                    : 'border-transparent text-vy-grey hover:bg-vy-border/10 hover:text-vy-white hover:border-vy-grey'
                }`
              }
            >
              <item.icon size={16} />
              {item.name}
            </NavLink>
          ))}
          
          <div className="pt-8 mt-4 border-t border-vy-border">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-xs tracking-widest uppercase text-vy-grey hover:text-red-400 hover:bg-red-400/10 transition-colors border-l-2 border-transparent hover:border-red-400"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 px-6 md:px-12 py-8 min-w-0">
        <Outlet />
      </main>

    </div>
  );
};

export default DashboardLayout;
