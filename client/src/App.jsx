import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// Pages
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import SearchPage from './pages/SearchPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminLeads from './pages/admin/AdminLeads';

function App() {
  return (
    <HelmetProvider>
      <Router>
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
                <Route path="/product/:slug" element={<><ProductPage /><Footer /></>} />
                <Route path="/cart" element={<><CartPage /><Footer /></>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

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
                <Route path="leads" element={<AdminLeads />} />
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
