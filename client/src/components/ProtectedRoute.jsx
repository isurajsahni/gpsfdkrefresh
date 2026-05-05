import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, marketingOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/register" replace />;
  if (adminOnly && !['admin', 'admin_marketing', 'order_manager', 'coupon_manager'].includes(user.role)) return <Navigate to="/" replace />;
  if (marketingOnly && !['admin', 'admin_marketing', 'marketing'].includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
