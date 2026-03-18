import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineMenu, HiOutlineX, HiChevronDown, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import logo from '../../assets/vite.webp';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { setIsCartOpen, setIsSearchOpen } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { name: 'Wall Canvas', slug: 'wall-canvas', subcats: ['The Velocity Suite', 'Tethered Horizons', 'The Gaze of Power', 'Millionaire Art', 'Nostalgia Noir'] },
    { name: 'House Nameplates', slug: 'house-nameplates', subcats: [] },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-cream backdrop-blur-lg shadow-2xl' : 'bg-cream'}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-0">
          <div className="flex items-center justify-between h-16 md:h-20">

            <div className="flex items-center gap-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="">
                <img src={logo} alt="Logo" className="h-20 w-auto" />
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {categories.map((cat) => (
                <div key={cat.slug} className="relative group">
                  <Link
                    to={`/category/${cat.slug}`}
                    className="flex items-center gap-1 text-secondary hover:text-accent font-semibold text-md tracking-wide transition-colors duration-300"
                  >
                    {cat.name}
                    {cat.subcats.length > 0 && <HiChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />}
                  </Link>
                  {cat.subcats.length > 0 && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 py-3 min-w-[220px]">
                        {cat.subcats.map((sub) => (
                          <Link
                            key={sub}
                            to={`/category/${cat.slug}`}
                            className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-cream hover:text-secondary transition-colors"
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
</div>
            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-secondary hover:text-accent transition-colors duration-300"
              >
                <HiOutlineSearch className="w-6 h-6" />
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-secondary hover:text-accent transition-colors duration-300"
              >
                <HiOutlineShoppingBag className="w-6 h-6" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-accent text-secondary text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* User */}
              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setUserMenu(!userMenu)}
                      className="flex items-center gap-2 p-2 text-secondary hover:text-accent transition-colors duration-300"
                    >
                      <HiOutlineUser className="w-6 h-6" />
                      <span className="hidden lg:block text-sm font-medium">{user.name}</span>
                    </button>
                    <AnimatePresence>
                      {userMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 min-w-[180px]"
                        >
                          <Link to="/dashboard" onClick={() => setUserMenu(false)} className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-cream hover:text-secondary transition-colors">
                            My Orders
                          </Link>
                          {user.role === 'admin' && (
                            <Link to="/admin" onClick={() => setUserMenu(false)} className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-cream hover:text-secondary transition-colors">
                              Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={() => { logout(); setUserMenu(false); navigate('/'); }}
                            className="block w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link to="/login" className="p-2 text-secondary hover:text-accent transition-colors duration-300">
                    <HiOutlineUser className="w-6 h-6" />
                  </Link>
                )}
              </div>

              {/* Mobile Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-secondary hover:text-accent transition-colors"
              >
                {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 bg-secondary pt-20"
          >
            <div className="p-6 space-y-4">
              {categories.map((cat) => (
                <div key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block text-xl text-white font-heading py-3 border-b border-white/10"
                  >
                    {cat.name}
                  </Link>
                </div>
              ))}
              <button
                onClick={() => { setMobileOpen(false); setIsSearchOpen(true); }}
                className="block w-full text-left text-xl text-white font-heading py-3 border-b border-white/10"
              >
                Search
              </button>
              <button
                onClick={() => { setMobileOpen(false); setIsCartOpen(true); }}
                className="block w-full text-left text-xl text-white font-heading py-3 border-b border-white/10"
              >
                Cart ({cartCount})
              </button>
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-xl text-accent font-heading py-3"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
