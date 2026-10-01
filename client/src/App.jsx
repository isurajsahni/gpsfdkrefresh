import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import CartDrawer from './components/layout/CartDrawer';
import SearchOverlay from './components/layout/SearchOverlay';
import API from './utils/api';
import ChatBot from './components/common/ChatBot';
import ErrorBoundary from './components/common/ErrorBoundary';
import NavigationProgress from './components/common/NavigationProgress';
import { lazyPage, startRoutePrefetch } from './utils/routePrefetch';

// Isolated Testing Pages (lazy — bypasses Router entirely)
const InvoicePreview = lazy(() => import('./pages/InvoicePreview'));

// ─── Eager: the landing page, and the 404 fallback ───
import StorePage from './pages/StorePage';
import NotFoundPage from './pages/NotFoundPage';

// ─── Common next steps: on demand, but fetched in the background once the
// first page has settled (see App), so opening one is still instant ───
const CategoryPage = lazyPage(() => import('./pages/CategoryPage'));
const ProductPage = lazyPage(() => import('./pages/ProductPage'));
const HomePage = lazyPage(() => import('./pages/HomePage'));
const CartPage = lazyPage(() => import('./pages/CartPage'));
const AdminLayout = lazyPage(() => import('./components/admin/AdminLayout'));

// ─── Code-split (everything else loads on demand) ───
// Each lazyPage() call becomes its own chunk, so guests on the homepage no
// longer download admin + marketing + invoice bundles. A page is fetched as
// soon as someone points at or taps a link to it (see startRoutePrefetch).
const CheckoutPage = lazyPage(() => import('./pages/CheckoutPage'));
const ThankYouPage = lazyPage(() => import('./pages/ThankYouPage'));
const LoginPage = lazyPage(() => import('./pages/LoginPage'));
const RegisterPage = lazyPage(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazyPage(() => import('./pages/ForgotPasswordPage'));
const UserDashboard = lazyPage(() => import('./pages/UserDashboard'));
const SearchPage = lazyPage(() => import('./pages/SearchPage'));
const AboutUs = lazyPage(() => import('./pages/info/AboutUs'));
// Contact.jsx is the consultancy landing page (routed at /consultancy);
// ContactUs.jsx is the general contact page at /contact.
const Contact = lazyPage(() => import('./pages/info/Contact'));
const ContactUs = lazyPage(() => import('./pages/info/ContactUs'));
const FAQ = lazyPage(() => import('./pages/info/FAQ'));
const ShippingPolicy = lazyPage(() => import('./pages/support/ShippingPolicy'));
const ReturnsRefunds = lazyPage(() => import('./pages/support/ReturnsRefunds'));
const PrivacyPolicy = lazyPage(() => import('./pages/info/PrivacyPolicy'));
const CEOPage = lazyPage(() => import('./pages/info/CEOPage'));
const Vision = lazyPage(() => import('./pages/info/Vision'));
const SchoolOfLearning = lazyPage(() => import('./pages/info/SchoolOfLearning'));
const Love = lazyPage(() => import('./pages/info/Love'));
const Partner = lazyPage(() => import('./pages/info/Partner'));
const Support = lazyPage(() => import('./pages/info/Support'));
const TermsConditions = lazyPage(() => import('./pages/support/TermsConditions'));
const LocationPage = lazyPage(() => import('./pages/LocationPage'));
const BlogList = lazyPage(() => import('./pages/BlogList'));
const BlogPost = lazyPage(() => import('./pages/BlogPost'));
const TrackOrderPage = lazyPage(() => import('./pages/TrackOrderPage'));
const CustomizeCanvasPage = lazyPage(() => import('./pages/CustomizeCanvasPage'));
// Canvas Page v2 — internal demo of the Figma rebuild. Not linked from nav, noindex.
const CanvasLandingV2 = lazyPage(() => import('./pages/CanvasLandingV2'));
// Consultancy v2 — internal demo of the Figma "Consultancy" frame. Not linked from nav, noindex.
const ConsultancyLandingV2 = lazyPage(() => import('./pages/ConsultancyLandingV2'));
const SEO_PremiumWallCanvasIndia = lazyPage(() => import('./pages/SEO_PremiumWallCanvasIndia'));
const WhatsAppLogin = lazyPage(() => import('./pages/WhatsAppLogin'));

// Admin Pages (heavy — never need to ship to anonymous visitors)
const AdminDashboard = lazyPage(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazyPage(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazyPage(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazyPage(() => import('./pages/admin/AdminUsers'));
const AdminCategories = lazyPage(() => import('./pages/admin/AdminCategories'));
const AdminCoupons = lazyPage(() => import('./pages/admin/AdminCoupons'));
const AdminAbandonedCarts = lazyPage(() => import('./pages/admin/AdminAbandonedCarts'));
const AdminWishlist = lazyPage(() => import('./pages/admin/AdminWishlist'));
const AdminLeads = lazyPage(() => import('./pages/admin/AdminLeads'));
const AdminAnalytics = lazyPage(() => import('./pages/admin/AdminAnalytics'));
const AdminMarketingPerformance = lazyPage(() => import('./pages/admin/AdminMarketingPerformance'));

// Marketing Pages
const MarketingLayout = lazyPage(() => import('./components/marketing/MarketingLayout'));
const MarketingDashboard = lazyPage(() => import('./pages/marketing/MarketingDashboard'));
const MarketingUsageHistory = lazyPage(() => import('./pages/marketing/MarketingUsageHistory'));

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

const captureUTM = () => {
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

const captureUTMOnce = () => {
  try {
    captureUTM();
  } catch {
    // Attribution is best-effort and must never stop the app from starting
  }
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
      window.gtag('config', 'G-ZCBBBEV6VE', {
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
      <NavigationProgress />
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      <ChatBot />
    </>
  );
};

// Every route here also needs a rewrite in client/vercel.json. Without one,
// Vercel serves it from 404.html: the page still renders, but with a 404
// status, so search engines drop it.
const pageRoutes = (
  <>
    {/* Public */}
    <Route path="/" element={<><StorePage /><Footer /></>} />
    <Route path="/home" element={<><HomePage /><Footer /></>} />
    <Route path="/store" element={<><StorePage /><Footer /></>} />
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
    {/* Two distinct pages. /consultancy is the services pitch with its
        own enquiry funnel (it used to sit at /contact, which is what
        made the URL contradict the label); /contact is general
        contact — channels, a message form, and self-serve links. */}
    <Route path="/consultancy" element={<><Contact /><Footer /></>} />
    <Route path="/contact" element={<><ContactUs /><Footer /></>} />
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
      <Route path="wishlist" element={<AdminWishlist />} />
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

    {/* Canvas — the Wall Canvas landing page. The old all-canvas listing
        at /wall-canvas and the v2 demo URL redirect here (vercel.json
        301s them too); collections stay at /wall-canvas/<collection>. */}
    <Route path="/canvas" element={<><CanvasLandingV2 /><Footer /></>} />
    <Route path="/wall-canvas" element={<Navigate to="/canvas" replace />} />
    <Route path="/canvas-v2-demo" element={<Navigate to="/canvas" replace />} />

    {/* Consultancy v2 — internal demo only. Not linked from nav; SEO noindex.
        The live /consultancy page and its enquiry form are unchanged. */}
    <Route path="/consultancy-v2-demo" element={<><ConsultancyLandingV2 /><Footer /></>} />

    {/* Category pages — MUST be last (catch-all pattern) */}
    <Route path="/:slug" element={<><CategoryPage /><Footer /></>} />
    <Route path="/:slug/:subcategorySlug" element={<><CategoryPage /><Footer /></>} />

    {/* 404 Fallback */}
    <Route path="*" element={<NotFoundPage />} />
  </>
);

function App() {
  useEffect(() => {
    captureUTMOnce();
  }, []);

  // Fetch pages ahead of the click: the header's and footer's, and category
  // and product pages (the store's cards), once this one has loaded; any
  // other on hover, focus or touch
  useEffect(() => startRoutePrefetch(pageRoutes, { warm: [CategoryPage, ProductPage] }), []);

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
                style: { background: '#0B5D3B', color: '#fff', borderRadius: '12px', fontFamily: 'var(--font-sf)' },
                success: { iconTheme: { primary: '#F15A29', secondary: '#fff' } },
              }} />
              
              <GlobalUI />

              <Suspense fallback={<SuspenseFallback />}>
              <Routes>{pageRoutes}</Routes>
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
