import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { HiOutlineChartBar, HiOutlineClipboardList, HiOutlineArrowLeft, HiOutlineMenu } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/marketing', icon: HiOutlineChartBar, label: 'Dashboard' },
  { path: '/marketing/usage', icon: HiOutlineClipboardList, label: 'Usage History' },
];

const MarketingLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Mobile toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-24 left-4 z-50 lg:hidden bg-secondary text-white p-2 rounded-lg shadow-lg">
        <HiOutlineMenu className="w-5 h-5" />
      </button>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-20 left-0 z-40 w-64 h-[calc(100vh-5rem)] bg-white border-r border-gray-100 shadow-sm transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6">
            <h2 className="font-heading text-xl font-bold text-secondary">Marketing Hub</h2>
            <p className="text-sm text-gray-400 mt-1">{user?.name || user?.email}</p>
          </div>
          <nav className="px-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                end={item.path === '/marketing' ? 'true' : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${location.pathname === item.path ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-cream hover:text-secondary'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-6 left-0 right-0 px-3">
            <Link to="/" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:text-secondary transition-colors">
              <HiOutlineArrowLeft className="w-4 h-4" /> Back to Store
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 min-h-[calc(100vh-5rem)] overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default MarketingLayout;
