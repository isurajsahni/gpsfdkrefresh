import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validators, sanitize } from '../utils/validation';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  
  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login, phoneLogin } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize RecaptchaVerifier
    if (!window.recaptchaVerifier && loginMethod === 'phone') {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved - will proceed with submit function
          },
          'expired-callback': () => {
            toast.error('Recaptcha Expired, please try again.');
          }
        });
      } catch (err) {
        console.error("Recaptcha Init Error", err);
      }
    }
  }, [loginMethod]);

  const handleBlur = (field, value) => {
    const error = validators[field] ? validators[field](value) : '';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const emailError = validators.email(email);
    if (emailError || !password) {
      setErrors({ email: emailError, password: !password ? 'Password is required' : '' });
      toast.error('Please enter valid credentials');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = sanitize(email);
      const data = await login(cleanEmail, password);
      handleSuccessRedirect(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number with country code.");
      return;
    }

    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const fmtPhone = phone.startsWith('+') ? phone : `+${phone}`;
      const result = await signInWithPhoneNumber(auth, fmtPhone, appVerifier);
      setConfirmationResult(result);
      setShowOtpField(true);
      toast.success("OTP sent to your phone!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send OTP.');
      // Reset recaptcha if failed
      if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // Call our backend API
      const data = await phoneLogin(idToken);
      handleSuccessRedirect(data);
    } catch (err) {
      console.error(err);
      toast.error('Invalid OTP or login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleSuccessRedirect = (data) => {
    toast.success(`Welcome back${data.name ? ', ' + data.name : ''}!`);
    if (data.role === 'admin' || data.role === 'admin_marketing') {
      navigate('/admin');
    } else if (data.role === 'marketing') {
      navigate('/marketing');
    } else if (cartItems.length > 0) {
      navigate('/checkout');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 pt-32 pb-24">
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

          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setLoginMethod('phone'); setShowOtpField(false); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${loginMethod === 'phone' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
            >
              Phone (OTP)
            </button>
            <button
              onClick={() => { setLoginMethod('email'); setShowOtpField(false); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${loginMethod === 'email' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
            >
              Email (Password)
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loginMethod === 'phone' ? (
              <motion.div
                key="phone-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {!showOtpField ? (
                  <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                        placeholder="+919876543210"
                      />
                      <p className="text-xs text-gray-400 mt-1">Include your country code (e.g. +91)</p>
                    </div>
                    
                    <div id="recaptcha-container"></div>
                    
                    <button 
                      type="submit" 
                      disabled={loading || !phone} 
                      className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-5 py-3.5 bg-primary border text-center text-xl tracking-widest border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                        placeholder="------"
                        maxLength="6"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading || !otp} 
                      className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOtpField(false)}
                      className="w-full text-sm text-gray-500 hover:text-secondary mt-3"
                    >
                      Change Phone Number
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleEmailLogin} className="space-y-5" noValidate>
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
              </motion.div>
            )}
          </AnimatePresence>

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
