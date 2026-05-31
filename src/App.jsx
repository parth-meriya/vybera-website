import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Layout
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import CustomCursor from './components/ui/CustomCursor';
import ScrollToTop from './components/ui/ScrollToTop';
import PageTransition from './components/ui/PageTransition';
import BackgroundMusic from './components/ui/BackgroundMusic';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/ui/ProtectedRoute';
import PopupBanner from './components/ui/PopupBanner';

// User Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import About from './pages/About';
import Contact from './pages/Contact';
import OrderSuccess from './pages/OrderSuccess';
import Customize from './pages/Customize';
import Campaign from './pages/campaign/Campaign';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Orders from './pages/dashboard/Orders';
import Rewards from './pages/dashboard/Rewards';
import CustomDesigns from './pages/dashboard/CustomDesigns';
import Wishlist from './pages/dashboard/Wishlist';
import Addresses from './pages/dashboard/Addresses';
import Coupons from './pages/dashboard/Coupons';
import CampaignRewards from './pages/dashboard/CampaignRewards';
import Notifications from './pages/dashboard/Notifications';
import Settings from './pages/dashboard/Settings';
import Security from './pages/dashboard/Security';
import TrackOrder from './pages/TrackOrder';
import Couple from './pages/Couple';
import Embroidery from './pages/Embroidery';
import Kids from './pages/Kids';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminRewards from './pages/admin/AdminRewards';
import AdminContent from './pages/admin/AdminContent';
import AdminCustomOrders from './pages/admin/AdminCustomOrders';
import AdminSupport from './pages/admin/AdminSupport';
import AdminReviews from './pages/admin/AdminReviews';
import AdminPopupBanner from './pages/admin/AdminPopupBanner';
import AdminMainBanner from './pages/admin/AdminMainBanner';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminSections from './pages/admin/AdminSections';

// Dynamic Category
import CategoryPage from './pages/CategoryPage';

const UserLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const App = () => {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <CustomCursor />
      <BackgroundMusic />
      <PopupBanner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'toast-vybera',
          duration: 3000,
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* ── Public Routes ─────────────────────────────────────── */}
          <Route path="/" element={
            <UserLayout>
              <PageTransition><Home /></PageTransition>
            </UserLayout>
          } />
          <Route path="/shop" element={
            <UserLayout>
              <PageTransition><Shop /></PageTransition>
            </UserLayout>
          } />
          <Route path="/couple" element={
            <UserLayout>
              <PageTransition><Couple /></PageTransition>
            </UserLayout>
          } />
          <Route path="/embroidery" element={
            <UserLayout>
              <PageTransition><Embroidery /></PageTransition>
            </UserLayout>
          } />
          <Route path="/kids" element={
            <UserLayout>
              <PageTransition><Kids /></PageTransition>
            </UserLayout>
          } />
          <Route path="/product/:id" element={
            <UserLayout>
              <PageTransition><ProductDetail /></PageTransition>
            </UserLayout>
          } />
          <Route path="/cart" element={
            <UserLayout>
              <PageTransition><Cart /></PageTransition>
            </UserLayout>
          } />
          <Route path="/about" element={
            <UserLayout>
              <PageTransition><About /></PageTransition>
            </UserLayout>
          } />
          <Route path="/contact" element={
            <UserLayout>
              <PageTransition><Contact /></PageTransition>
            </UserLayout>
          } />
          <Route path="/customize" element={
            <UserLayout>
              <PageTransition><Customize /></PageTransition>
            </UserLayout>
          } />
          <Route path="/campaign/:id" element={
            <UserLayout>
              <PageTransition><Campaign /></PageTransition>
            </UserLayout>
          } />
          <Route path="/collections/:slug" element={
            <UserLayout>
              <PageTransition><CategoryPage /></PageTransition>
            </UserLayout>
          } />
          <Route path="/track-order/:id" element={
            <UserLayout>
              <PageTransition><TrackOrder /></PageTransition>
            </UserLayout>
          } />
          <Route path="/privacy-policy" element={
            <UserLayout>
              <PageTransition><PrivacyPolicy /></PageTransition>
            </UserLayout>
          } />
          <Route path="/terms" element={
            <UserLayout>
              <PageTransition><Terms /></PageTransition>
            </UserLayout>
          } />
          <Route path="/refund-policy" element={
            <UserLayout>
              <PageTransition><RefundPolicy /></PageTransition>
            </UserLayout>
          } />
          <Route path="/shipping-policy" element={
            <UserLayout>
              <PageTransition><ShippingPolicy /></PageTransition>
            </UserLayout>
          } />

          {/* ── Auth Routes (public) ───────────────────────────────── */}
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />

          {/* ── Protected Routes (require authentication) ─────────── */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <UserLayout>
                <PageTransition><Onboarding /></PageTransition>
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <UserLayout>
                <PageTransition><Checkout /></PageTransition>
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/order-success" element={
            <ProtectedRoute>
              <UserLayout>
                <PageTransition><OrderSuccess /></PageTransition>
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PageTransition><Overview /></PageTransition>} />
            <Route path="orders" element={<PageTransition><Orders /></PageTransition>} />
            <Route path="custom-designs" element={<PageTransition><CustomDesigns /></PageTransition>} />
            <Route path="rewards" element={<PageTransition><Rewards /></PageTransition>} />
            <Route path="wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
            <Route path="addresses" element={<PageTransition><Addresses /></PageTransition>} />
            <Route path="coupons" element={<PageTransition><Coupons /></PageTransition>} />
            <Route path="campaign-rewards" element={<PageTransition><CampaignRewards /></PageTransition>} />
            <Route path="notifications" element={<PageTransition><Notifications /></PageTransition>} />
            <Route path="settings" element={<PageTransition><Settings /></PageTransition>} />
            <Route path="security" element={<PageTransition><Security /></PageTransition>} />
          </Route>

          {/* ── Admin Routes (require admin role — enforced in AdminLayout) ── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="sections" element={<AdminSections />} />
            <Route path="rewards" element={<AdminRewards />} />
            <Route path="custom-orders" element={<AdminCustomOrders />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="popup-banners" element={<AdminPopupBanner />} />
            <Route path="main-banner" element={<AdminMainBanner />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;
