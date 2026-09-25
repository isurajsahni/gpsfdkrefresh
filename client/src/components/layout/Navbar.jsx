import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineMenu, HiOutlineX, HiOutlineSearch, HiChevronDown } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import useClickOutside from '../../hooks/useClickOutside';
import logo from '../../assets/vite.webp';

const NAV_LINKS = [
  {
    name: 'Store',
    path: '/',
    // `match`: the paths that count as being in that section, for the highlight
    children: [
      { name: 'Canvas', path: '/canvas', match: ['/canvas', '/wall-canvas', '/customize-canvas'] },
      { name: 'House Nameplates', path: '/house-nameplates', match: ['/house-nameplates'] },
    ],
  },
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
  const { pathname } = useLocation();
  // The Store menu opens on hover/focus. After a link is followed it stays
  // shut until the pointer leaves, so it doesn't sit open over the new page.
  const [storeMenuShut, setStoreMenuShut] = useState(false);
  const shutStoreMenu = () => {
    document.activeElement?.blur();
    setStoreMenuShut(true);
  };

  const isChildActive = (child) =>
    child.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  // A parent item reads as active on any of its dropdown pages too
  const isInSection = (link) => link.children?.some(isChildActive);

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
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop: nav content (logo + links + actions) centered as one
                group with even 40px gaps. Mobile keeps logo-left / actions-right. */}
            <div className="flex items-center justify-between lg:justify-center lg:gap-10 h-[60px]">

              <div className="flex items-center gap-10 h-full">
                {/* Logo → Home Page (legacy /home) */}
                <Link to="/home" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group h-full">
                  <img src={logo} alt="GPSFDK" className="max-w-[50px] h-full w-auto object-contain" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-10 h-full">
                  {NAV_LINKS.map((link) => link.children ? (
                    // Opens on hover, and on focus so keyboard users can tab into it
                    <div
                      key={link.path}
                      className="relative group h-full flex items-center"
                      onMouseLeave={() => setStoreMenuShut(false)}
                    >
                      <NavLink
                        to={link.path}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-1 text-xs font-normal transition-colors duration-300 ${
                            isActive || isInSection(link) ? 'text-accent' : 'text-[#424245] hover:text-accent'
                          }`
                        }
                      >
                        {link.name}
                        <HiChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180" />
                      </NavLink>
                      {/* pt-2 keeps the gap under the bar hoverable. w-max: an absolute
                          box is otherwise capped by the narrow Store link and wraps. */}
                      <div
                        className={`absolute left-1/2 top-full w-max -translate-x-1/2 translate-y-1 pt-2 invisible opacity-0 transition-all duration-200 ${
                          storeMenuShut ? '' : 'group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0'
                        }`}
                      >
                        <div className="flex flex-col gap-1.5 bg-white rounded-xl shadow-xl border border-gray-100 p-2 min-w-[200px]">
                          {link.children.map((child) => {
                            const active = isChildActive(child);
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={shutStoreMenu}
                                aria-current={active ? 'page' : undefined}
                                className={`flex items-center justify-between gap-6 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition-colors ${
                                  active ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-700 hover:bg-accent/10 hover:text-accent'
                                }`}
                              >
                                {child.name}
                                {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      end
                      className={({ isActive }) =>
                        `text-xs font-normal transition-colors duration-300 ${
                          isActive ? 'text-accent' : 'text-[#424245] hover:text-accent'
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
                  className="p-2 text-[#424245] hover:text-accent transition-colors duration-300"
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
                        className="flex items-center gap-2 p-2 text-[#424245] hover:text-accent transition-colors duration-300"
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
                            {/* Same roles ProtectedRoute lets into /admin — order/coupon
                                managers get a scoped sidebar there (AdminLayout filters it),
                                so they shouldn't have to type the URL by hand. */}
                            {['admin', 'admin_marketing', 'order_manager', 'coupon_manager'].includes(user.role) && (
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
                    <Link to="/register" aria-label="Sign in" className="p-2 text-[#424245] hover:text-accent transition-colors duration-300 block">
                      <HiOutlineUser className="w-6 h-6" />
                    </Link>
                  )}
                </div>

                {/* Cart */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  aria-label="Cart"
                  className="relative p-2 text-[#424245] hover:text-accent transition-colors duration-300"
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
                  className="lg:hidden p-2 text-[#424245] hover:text-accent transition-colors"
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
            className="fixed inset-0 z-40 bg-secondary pt-[60px]"
          >
            <div className="p-6 space-y-1 h-full overflow-y-auto pb-32">
              {NAV_LINKS.map((link) => (
                <div key={link.path} className="border-b border-white/10">
                  <NavLink
                    to={link.path}
                    end
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block text-xl font-heading py-3 ${isActive ? 'text-accent' : 'text-white'}`
                    }
                  >
                    {link.name}
                  </NavLink>
                  {link.children && (
                    <div className="pl-4 pb-2">
                      {link.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileOpen(false)}
                          aria-current={isChildActive(child) ? 'page' : undefined}
                          className={`block text-base font-heading py-2 ${isChildActive(child) ? 'text-accent' : 'text-white/80'}`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
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
