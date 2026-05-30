import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  FileText,
  Paintbrush,
  MessageSquare,
  Star,
  LogOut,
  Percent,
  Megaphone,
  Image as ImageIcon,
  Award
} from 'lucide-react';
import { logOut } from '../../firebase/auth';
import toast from 'react-hot-toast';
import BackButton from '../ui/BackButton';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/rewards', label: 'Rewards', icon: Award },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: Paintbrush },
  { to: '/admin/popup-banners', label: 'Popup Banners', icon: Megaphone },
  { to: '/admin/main-banner', label: 'Main Banner', icon: ImageIcon },
  { to: '/admin/support', label: 'Support', icon: MessageSquare },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/content', label: 'Content', icon: FileText },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    toast.success('Signed out.', { className: 'toast-vybera' });
    navigate('/');
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-vy-dark border-r border-vy-border min-h-screen flex flex-col">
      <div className="p-4 border-b border-vy-border">
        <BackButton />
      </div>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-vy-border">
        <Link to="/" className="font-display font-bold text-lg tracking-[0.3em] text-vy-white hover:opacity-80 transition-opacity">
          VYBERA
        </Link>
        <span className="ml-2 text-[10px] text-vy-accent tracking-widest uppercase border border-vy-accent/30 px-1.5 py-0.5">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-vy-border">
        <button
          onClick={handleLogout}
          className="admin-nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/5"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
