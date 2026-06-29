import { lazy, Suspense, useEffect } from 'react';
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

// User Pages (Lazy Loaded)
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Customize = lazy(() => import('./pages/Customize'));
const Campaign = lazy(() => import('./pages/campaign/Campaign'));
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Orders = lazy(() => import('./pages/dashboard/Orders'));
const Rewards = lazy(() => import('./pages/dashboard/Rewards'));
const CustomDesigns = lazy(() => import('./pages/dashboard/CustomDesigns'));
const Wishlist = lazy(() => import('./pages/dashboard/Wishlist'));
const Addresses = lazy(() => import('./pages/dashboard/Addresses'));
const Coupons = lazy(() => import('./pages/dashboard/Coupons'));
const CampaignRewards = lazy(() => import('./pages/dashboard/CampaignRewards'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Security = lazy(() => import('./pages/dashboard/Security'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Couple = lazy(() => import('./pages/Couple'));
const Embroidery = lazy(() => import('./pages/Embroidery'));
const Kids = lazy(() => import('./pages/Kids'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminRewards = lazy(() => import('./pages/admin/AdminRewards'));
const AdminContent = lazy(() => import('./pages/admin/AdminContent'));
const AdminCustomOrders = lazy(() => import('./pages/admin/AdminCustomOrders'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminPopupBanner = lazy(() => import('./pages/admin/AdminPopupBanner'));
const AdminMainBanner = lazy(() => import('./pages/admin/AdminMainBanner'));
const AdminCampaigns = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminSections = lazy(() => import('./pages/admin/AdminSections'));
const AdminSizeGuides = lazy(() => import('./pages/admin/AdminSizeGuides'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));

// Dynamic Category (Lazy Loaded)
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

const UserLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const App = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('referred_by', ref);
    }
  }, [location]);

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
        <Suspense fallback={
          <div className="min-h-screen bg-vy-black flex items-center justify-center flex-col gap-4">
            <div className="w-8 h-8 border-2 border-vy-white/20 border-t-vy-white rounded-full animate-spin" />
            <p className="text-[10px] text-vy-grey tracking-[0.3em] uppercase">Loading Vybera...</p>
          </div>
        }>
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
            <Route path="size-guides" element={<AdminSizeGuides />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  );
};

export default App;
