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
  Award,
  Ticket,
  Bell,
  Flame,
  Music
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
  { to: '/admin/diwali', label: 'Diwali Sale', icon: Flame },
  { to: '/admin/music', label: 'Diwali Music', icon: Music },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Ticket },
  { to: '/admin/sections', label: 'Sections', icon: LayoutDashboard },
  { to: '/admin/rewards', label: 'Rewards', icon: Award },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: Paintbrush },
  { to: '/admin/popup-banners', label: 'Popup Banners', icon: Megaphone },
  { to: '/admin/main-banner', label: 'Main Banner', icon: ImageIcon },
  { to: '/admin/support', label: 'Support', icon: MessageSquare },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/content', label: 'Content', icon: FileText },
  { to: '/admin/size-guides', label: 'Size Guides', icon: FileText },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    toast.success('Signed out.', { className: 'toast-vybera' });
    navigate('/');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[#E8D2B5] border-r border-[#D4BEA5] min-h-screen flex flex-col shadow-sm">
      <div className="p-4 border-b border-[#D4BEA5]">
        <BackButton />
      </div>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#D4BEA5] bg-[#E8D2B5]">
        <Link to="/" className="font-display font-bold text-xl tracking-[0.3em] text-[#590907] hover:opacity-80 transition-opacity">
          VYBERA
        </Link>
        <span className="ml-2 text-[10px] text-[#590907] tracking-widest uppercase font-bold border border-[#590907]/40 bg-[#FAF5ED] px-1.5 py-0.5 rounded-sm shadow-xs">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#D4BEA5] bg-[#E8D2B5]">
        <button
          onClick={handleLogout}
          className="admin-nav-link w-full text-rose-700 hover:text-rose-900 hover:bg-rose-500/15 font-semibold"
        >
          <LogOut size={16} className="shrink-0 text-rose-700" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
