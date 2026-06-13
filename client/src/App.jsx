import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import CartDrawer from './components/layout/CartDrawer';
import SearchOverlay from './components/layout/SearchOverlay';
import API from './utils/api';
import ChatBot from './components/common/ChatBot';
import ErrorBoundary from './components/common/ErrorBoundary';

// Isolated Testing Pages (lazy — bypasses Router entirely)
const InvoicePreview = lazy(() => import('./pages/InvoicePreview'));

// ─── Eager (above-the-fold / very common routes) ───
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import NotFoundPage from './pages/NotFoundPage';

// ─── Code-split (everything else loads on demand) ───
// Each lazy() call becomes its own chunk, so guests on the homepage no longer
// download admin + marketing + invoice bundles.
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AboutUs = lazy(() => import('./pages/info/AboutUs'));
const Contact = lazy(() => import('./pages/info/Contact'));
const FAQ = lazy(() => import('./pages/info/FAQ'));
const ShippingPolicy = lazy(() => import('./pages/support/ShippingPolicy'));
const ReturnsRefunds = lazy(() => import('./pages/support/ReturnsRefunds'));
const PrivacyPolicy = lazy(() => import('./pages/info/PrivacyPolicy'));
const CEOPage = lazy(() => import('./pages/info/CEOPage'));
const Vision = lazy(() => import('./pages/info/Vision'));
const SchoolOfLearning = lazy(() => import('./pages/info/SchoolOfLearning'));
const Love = lazy(() => import('./pages/info/Love'));
const Partner = lazy(() => import('./pages/info/Partner'));
const Support = lazy(() => import('./pages/info/Support'));
const TermsConditions = lazy(() => import('./pages/support/TermsConditions'));
const LocationPage = lazy(() => import('./pages/LocationPage'));
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));
const CustomizeCanvasPage = lazy(() => import('./pages/CustomizeCanvasPage'));
const SEO_PremiumWallCanvasIndia = lazy(() => import('./pages/SEO_PremiumWallCanvasIndia'));
const WhatsAppLogin = lazy(() => import('./pages/WhatsAppLogin'));

// Admin Pages (heavy — never need to ship to anonymous visitors)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminAbandonedCarts = lazy(() => import('./pages/admin/AdminAbandonedCarts'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminMarketingPerformance = lazy(() => import('./pages/admin/AdminMarketingPerformance'));

// Marketing Pages
const MarketingLayout = lazy(() => import('./components/marketing/MarketingLayout'));
const MarketingDashboard = lazy(() => import('./pages/marketing/MarketingDashboard'));
const MarketingUsageHistory = lazy(() => import('./pages/marketing/MarketingUsageHistory'));

// Lightweight inline fallback shown while a chunk is downloading.
const SuspenseFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Visitor ID + UTM Capture ───
const getVisitorId = () => {
  let id = localStorage.getItem('gpsfdk_visitor_id');
  if (!id) {
    // Prefer crypto.randomUUID (122 bits of entropy, collision-resistant).
    // Fallback to the legacy generator for browsers without crypto.randomUUID.
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      id = 'v_' + crypto.randomUUID();
    } else {
      id = 'v_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    }
    localStorage.setItem('gpsfdk_visitor_id', id);
  }
  return id;
};

const captureUTMOnce = () => {
  // Only capture UTM params on the very first page load of the session
  if (sessionStorage.getItem('utm_captured')) return;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utmKeys.forEach(key => {
    const val = params.get(key);
    if (val) sessionStorage.setItem(key, val);
  });
  // Capture referrer once
  if (document.referrer && !sessionStorage.getItem('initial_referrer')) {
    sessionStorage.setItem('initial_referrer', document.referrer);
  }
  sessionStorage.setItem('utm_captured', 'true');
};

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    // Simple scroll to top on route change
    window.scrollTo(0, 0);

    // Fire Meta Pixel PageView on every route change (SPA support)
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }

    // Fire Google Analytics pageview on every route change (SPA support)
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-5VKTKJYN5R', {
        page_path: location.pathname + location.search,
      });
    }

    // ─── Track page view to our analytics ───
    const trackPageView = async () => {
      try {
        await API.post('/analytics/track', {
          visitorId: getVisitorId(),
          pageUrl: location.pathname,
          referrer: sessionStorage.getItem('initial_referrer') || '',
          utmSource: sessionStorage.getItem('utm_source') || '',
          utmMedium: sessionStorage.getItem('utm_medium') || '',
          utmCampaign: sessionStorage.getItem('utm_campaign') || '',
          utmTerm: sessionStorage.getItem('utm_term') || '',
          utmContent: sessionStorage.getItem('utm_content') || '',
        });
      } catch (err) {
        // Silent fail — analytics should never block the user
      }
    };
    trackPageView();
  }, [location.pathname, location.search]);

  return null;
}

const GlobalUI = () => {
  const location = useLocation();
  const hideGlobalUI = location.pathname.startsWith('/invoice-preview') || location.pathname.startsWith('/generate-invoice-view');
  
  if (hideGlobalUI) return null;

  return (
    <>
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      <ChatBot />
    </>
  );
};

function App() {
  useEffect(() => {
    captureUTMOnce();
  }, []);

  // --- ISOLATED PREVIEW ROUTE ---
  // Completely bypasses all providers, routers, and API calls to guarantee no reload loops
  if (window.location.pathname.startsWith('/invoice-preview')) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <InvoicePreview />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
    <HelmetProvider>
      <Router>
        <ScrollManager />
        <AuthProvider>
          <UIProvider>
            <CurrencyProvider>
            <CartProvider>
              <Toaster position="top-center" toastOptions={{
                style: { background: '#0B5D3B', color: '#fff', borderRadius: '12px', fontFamily: '"DM Sans", sans-serif' },
                success: { iconTheme: { primary: '#F15A29', secondary: '#fff' } },
              }} />
              
              <GlobalUI />

              <Suspense fallback={<SuspenseFallback />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<><HomePage /><Footer /></>} />
                <Route path="/search" element={<><SearchPage /><Footer /></>} />
                <Route path="/customize-canvas" element={<><CustomizeCanvasPage /><Footer /></>} />
                <Route path="/product/:slug" element={<><ProductPage /><Footer /></>} />
                <Route path="/cart" element={<><CartPage /><Footer /></>} />
                <Route path="/login" element={<><LoginPage /><Footer /></>} />
                <Route path="/register" element={<><RegisterPage /><Footer /></>} />
                <Route path="/forgot-password" element={<><ForgotPasswordPage /><Footer /></>} />
                <Route path="/whatsapp-login" element={<><WhatsAppLogin /><Footer /></>} />
                
                {/* Location SEO Landing Pages */}
                <Route path="/location/:city" element={<><LocationPage /><Footer /></>} />
                
                {/* Blog */}
                <Route path="/blog" element={<><BlogList /><Footer /></>} />
                <Route path="/blog/:slug" element={<><BlogPost /><Footer /></>} />
                
                {/* Info & Policy */}
                <Route path="/about" element={<><AboutUs /><Footer /></>} />
                <Route path="/ceo" element={<><CEOPage /><Footer /></>} />
                <Route path="/vision" element={<><Vision /><Footer /></>} />
                <Route path="/contact" element={<><Contact /><Footer /></>} />
                <Route path="/faq" element={<><FAQ /><Footer /></>} />
                <Route path="/shipping-policy" element={<><ShippingPolicy /><Footer /></>} />
                <Route path="/returns-refunds" element={<><ReturnsRefunds /><Footer /></>} />
                <Route path="/privacy-policy" element={<><PrivacyPolicy /><Footer /></>} />
                <Route path="/terms-conditions" element={<><TermsConditions /><Footer /></>} />

                {/* GPS Business Group pillars (coming soon) */}
                <Route path="/school-of-learning" element={<><SchoolOfLearning /><Footer /></>} />
                <Route path="/love" element={<><Love /><Footer /></>} />
                <Route path="/partner" element={<><Partner /><Footer /></>} />
                <Route path="/support" element={<><Support /><Footer /></>} />

              {/* Checkout & ThankYou are guest-accessible — the server-side guest
                  order endpoint (/orders/guest) handles unauthenticated buyers.
                  Gating these behind ProtectedRoute forced every buyer to register,
                  killing conversions. */}
              <Route path="/checkout" element={<><CheckoutPage /><Footer /></>} />
              <Route path="/thank-you" element={<><ThankYouPage /><Footer /></>} />
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /><Footer /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="marketing-performance" element={<AdminMarketingPerformance />} />
              </Route>

              {/* Marketing Dashboard */}
              <Route path="/marketing" element={<ProtectedRoute marketingOnly><MarketingLayout /></ProtectedRoute>}>
                <Route index element={<MarketingDashboard />} />
                <Route path="usage" element={<MarketingUsageHistory />} />
              </Route>

              {/* Order Tracking */}
              <Route path="/track-order" element={<><TrackOrderPage /><Footer /></>} />

              {/* SEO Top Landing Pages */}
              <Route path="/premium-wall-canvas-india" element={<><SEO_PremiumWallCanvasIndia /><Footer /></>} />

              {/* Category pages — MUST be last (catch-all pattern) */}
              <Route path="/:slug" element={<><CategoryPage /><Footer /></>} />
              <Route path="/:slug/:subcategorySlug" element={<><CategoryPage /><Footer /></>} />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
              </Suspense>
          </CartProvider>
            </CurrencyProvider>
        </UIProvider>
      </AuthProvider>
      </Router>
      <Analytics />
    </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
