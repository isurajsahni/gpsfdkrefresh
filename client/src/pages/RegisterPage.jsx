import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validators, sanitize } from '../utils/validation';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const RegisterPage = () => {
  const [signupMethod, setSignupMethod] = useState('phone'); // 'phone' or 'email'
  
  // Email states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register, phoneLogin } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize RecaptchaVerifier
    if (!window.recaptchaVerifier && signupMethod === 'phone') {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-cont', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
             toast.error('Recaptcha Expired, please try again.');
          }
        });
      } catch (err) {
        console.error("Recaptcha Init Error", err);
      }
    }
  }, [signupMethod]);

  const handleBlur = (field, value) => {
    const error = validators[field] ? validators[field](value) : '';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    const emailError = validators.email(email);
    if (emailError || !password || !name) {
      toast.error('Please enter valid credentials');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = sanitize(email);
      const data = await register(name, cleanEmail, password, ''); // No phone for email signup right now for simplicity 
      handleSuccessRedirect(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
      
      const idToken = await user.getIdToken();
      // Using phoneLogin effectively logs in or creates the account
      const data = await phoneLogin(idToken);
      handleSuccessRedirect(data);
    } catch (err) {
      console.error(err);
      toast.error('Invalid OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleSuccessRedirect = (data) => {
    toast.success(`Account created! Welcome, ${data.name || 'User'}!`);
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
            <h1 className="text-3xl font-heading font-bold text-secondary">Create Account</h1>
            <p className="text-gray-500 mt-2">Join us today</p>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setSignupMethod('phone'); setShowOtpField(false); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${signupMethod === 'phone' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
            >
              Phone (OTP)
            </button>
            <button
              onClick={() => { setSignupMethod('email'); setShowOtpField(false); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${signupMethod === 'email' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
            >
              Email (Password)
            </button>
          </div>

          <AnimatePresence mode="wait">
            {signupMethod === 'phone' ? (
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
                    
                    <div id="recaptcha-cont"></div>
                    
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
                      {loading ? 'Verifying...' : 'Verify & Setup Account'}
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
                <form onSubmit={handleEmailSignup} className="space-y-5" noValidate>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Full Name</label>
                    <input
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                    />
                  </div>
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
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Sign Up'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account? <Link to="/login" className="text-accent font-semibold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
