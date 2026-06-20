import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineMenu, HiOutlineX, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import useClickOutside from '../../hooks/useClickOutside';
import logo from '../../assets/vite.webp';

const NAV_LINKS = [
  { name: 'Store', path: '/' },
  { name: 'School of Learning', path: '/school-of-learning' },
  { name: 'Love', path: '/love' },
  { name: 'Vision', path: '/vision' },
  { name: 'Partner', path: '/partner' },
  { name: 'Support', path: '/support' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { setIsCartOpen, setIsSearchOpen } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setUserMenu(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (Math.abs(window.scrollY - lastScrollY) > 10) setMobileOpen(false);
    };
    const timer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mobileOpen]);

  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setUserMenu(false));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <nav className={`transition-all duration-500 w-full ${scrolled ? 'bg-cream/95 backdrop-blur-lg shadow-md' : 'bg-cream'}`}>
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-0">
            <div className="flex items-center justify-between h-16 md:h-20">

              <div className="flex items-center gap-10">
                {/* Logo → Home Page (legacy /home) */}
                <Link to="/home" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group">
                  <img src={logo} alt="GPSFDK" className="h-14 md:h-20 w-auto" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                  {NAV_LINKS.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      end
                      className={({ isActive }) =>
                        `font-semibold text-sm tracking-wide transition-colors duration-300 ${
                          isActive ? 'text-accent' : 'text-secondary hover:text-accent'
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search"
                  className="p-2 text-secondary hover:text-accent transition-colors duration-300"
                >
                  <HiOutlineSearch className="w-6 h-6" />
                </button>

                {/* User */}
                <div className="relative" ref={menuRef}>
                  {user ? (
                    <>
                      <button
                        onClick={() => setUserMenu(!userMenu)}
                        aria-label="Account"
                        className="flex items-center gap-2 p-2 text-secondary hover:text-accent transition-colors duration-300"
                      >
                        <HiOutlineUser className="w-6 h-6" />
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
                            {(user.role === 'admin' || user.role === 'admin_marketing') && (
                              <Link to="/admin" onClick={() => setUserMenu(false)} className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-cream hover:text-secondary transition-colors">
                                Admin Panel
                              </Link>
                            )}
                            {(user.role === 'marketing' || user.role === 'admin_marketing') && (
                              <Link to="/marketing" onClick={() => setUserMenu(false)} className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-cream hover:text-secondary transition-colors">
                                Marketing Dashboard
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
                    <Link to="/register" aria-label="Sign in" className="p-2 text-secondary hover:text-accent transition-colors duration-300 block">
                      <HiOutlineUser className="w-6 h-6" />
                    </Link>
                  )}
                </div>

                {/* Cart */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  aria-label="Cart"
                  className="relative p-2 text-secondary hover:text-accent transition-colors duration-300"
                >
                  <HiOutlineShoppingBag className="w-6 h-6" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </button>

                {/* Mobile Toggle */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Menu"
                  className="lg:hidden p-2 text-secondary hover:text-accent transition-colors"
                >
                  {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

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
            <div className="p-6 space-y-1 h-full overflow-y-auto pb-32">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block text-xl font-heading py-3 border-b border-white/10 ${
                      isActive ? 'text-accent' : 'text-white'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
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
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-xl text-accent font-heading py-3"
                >
                  Register
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
