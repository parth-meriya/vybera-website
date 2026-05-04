import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Layout
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import CustomCursor from './components/ui/CustomCursor';
import PageTransition from './components/ui/PageTransition';
import AdminLayout from './components/admin/AdminLayout';

// User Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import About from './pages/About';
import Contact from './pages/Contact';
import OrderSuccess from './pages/OrderSuccess';
import Customize from './pages/Customize';
import MyOrders from './pages/MyOrders';
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
import AdminContent from './pages/admin/AdminContent';
import AdminCustomOrders from './pages/admin/AdminCustomOrders';
import AdminSupport from './pages/admin/AdminSupport';
import AdminReviews from './pages/admin/AdminReviews';

const UserLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const App = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <CustomCursor />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'toast-vybera',
          duration: 3000,
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* User Routes */}
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
          <Route path="/checkout" element={
            <UserLayout>
              <PageTransition><Checkout /></PageTransition>
            </UserLayout>
          } />
          <Route path="/order-success" element={
            <UserLayout>
              <PageTransition><OrderSuccess /></PageTransition>
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
          <Route path="/my-orders" element={
            <UserLayout>
              <PageTransition><MyOrders /></PageTransition>
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
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="custom-orders" element={<AdminCustomOrders />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="content" element={<AdminContent />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;
