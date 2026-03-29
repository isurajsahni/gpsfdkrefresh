import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { validators, sanitize } from '../utils/validation';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleBlur = (field, value) => {
    const error = validators[field] ? validators[field](value) : '';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Quick validation
    const emailError = validators.email(email);
    if (emailError || !password) {
      setErrors({ email: emailError, password: !password ? 'Password is required' : '' });
      toast.error('Please enter valid credentials');
      return;
    }

    setLoading(true);
    try {
      // Sanitize inputs before sending
      const cleanEmail = sanitize(email);
      const data = await login(cleanEmail, password);
      toast.success(`Welcome back, ${data.name}!`);
      navigate(data.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-secondary">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Email</label>
              <input
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                onBlur={(e) => handleBlur('email', e.target.value)}
                className={`w-full px-5 py-3.5 bg-primary border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Password</label>
              <input
                type="password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                onBlur={(e) => { if(!e.target.value) handleBlur('password', e.target.value); }}
                className={`w-full px-5 py-3.5 bg-primary border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-sm text-secondary hover:text-accent font-medium transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || (errors.email || errors.password)} 
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account? <Link to="/register" className="text-accent font-semibold hover:underline">Register</Link>
            </p>
        </div>


        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
