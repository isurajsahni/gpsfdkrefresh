import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import CartDrawer from './components/layout/CartDrawer';
import SearchOverlay from './components/layout/SearchOverlay';
import API from './utils/api';

// Pages
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UserDashboard from './pages/UserDashboard';
import SearchPage from './pages/SearchPage';
import AboutUs from './pages/info/AboutUs';
import Contact from './pages/info/Contact';
import FAQ from './pages/info/FAQ';
import ShippingPolicy from './pages/support/ShippingPolicy';
import ReturnsRefunds from './pages/support/ReturnsRefunds';
import PrivacyPolicy from './pages/info/PrivacyPolicy';
import CEOPage from './pages/info/CEOPage';
import TermsConditions from './pages/support/TermsConditions';
import LocationPage from './pages/LocationPage';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import Lenis from '@studio-freight/lenis';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminLeads from './pages/admin/AdminLeads';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.documentElement.classList.remove('lenis');
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
    });

    let animationFrameId;
    function raf(time) {
      if (!location.pathname.startsWith('/admin')) {
        lenis.raf(time);
      }
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, [location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    // Analytics tracking
    const trackVisit = async () => {
      if (!sessionStorage.getItem('hasVisited')) {
        try {
          await API.post('/analytics/visit');
          sessionStorage.setItem('hasVisited', 'true');
        } catch (error) {
          console.error('Failed to track visit:', error);
        }
      }
    };
    trackVisit();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <ScrollManager />
        <AuthProvider>
          <UIProvider>
            <CartProvider>
              <Toaster position="top-center" toastOptions={{
                style: { background: '#0B5D3B', color: '#fff', borderRadius: '12px', fontFamily: '"DM Sans", sans-serif' },
                success: { iconTheme: { primary: '#F15A29', secondary: '#fff' } },
              }} />
              <Navbar />
              <CartDrawer />
              <SearchOverlay />
              <Routes>
                {/* Public */}
                <Route path="/" element={<><HomePage /><Footer /></>} />
                <Route path="/search" element={<><SearchPage /><Footer /></>} />
                <Route path="/category/:slug" element={<><CategoryPage /><Footer /></>} />
                <Route path="/category/:slug/:subcategorySlug" element={<><CategoryPage /><Footer /></>} />
                <Route path="/product/:slug" element={<><ProductPage /><Footer /></>} />
                <Route path="/cart" element={<><CartPage /><Footer /></>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Location SEO Landing Pages */}
                <Route path="/location/:city" element={<><LocationPage /><Footer /></>} />
                
                {/* Blog */}
                <Route path="/blog" element={<><BlogList /><Footer /></>} />
                <Route path="/blog/:slug" element={<><BlogPost /><Footer /></>} />
                
                {/* Info & Policy */}
                <Route path="/about" element={<><AboutUs /><Footer /></>} />
                <Route path="/ceo" element={<><CEOPage /><Footer /></>} />
                <Route path="/contact" element={<><Contact /><Footer /></>} />
                <Route path="/faq" element={<><FAQ /><Footer /></>} />
                <Route path="/shipping-policy" element={<><ShippingPolicy /><Footer /></>} />
                <Route path="/returns-refunds" element={<><ReturnsRefunds /><Footer /></>} />
                <Route path="/privacy-policy" element={<><PrivacyPolicy /><Footer /></>} />
                <Route path="/terms-conditions" element={<><TermsConditions /><Footer /></>} />

              {/* Protected */}
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /><Footer /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /><Footer /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
            </Routes>
          </CartProvider>
        </UIProvider>
      </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
