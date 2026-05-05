import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { validators } from '../../utils/validation';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineShieldCheck, HiOutlineChatAlt2 } from 'react-icons/hi';
import { IoLogoWhatsapp } from 'react-icons/io5';
const PasswordlessAuth = ({ isRegister = false }) => {
  const [step, setStep] = useState('identifier'); // 'identifier' | 'channel' | 'otp' | 'complete'
  const [identifier, setIdentifier] = useState('');
  const [isEmail, setIsEmail] = useState(false);
  const [channel, setChannel] = useState(''); // 'email' | 'whatsapp' | 'sms'
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef([]);
  const [tempToken, setTempToken] = useState('');
  const [newUserDetails, setNewUserDetails] = useState({ name: '', email: '' });

  const { updateUser } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);



  const handleIdentifierSubmit = (e) => {
    e.preventDefault();
    if (!identifier) {
      toast.error('Please enter your email or phone number');
      return;
    }
    const emailCheck = identifier.includes('@');
    setIsEmail(emailCheck);
    
    if (emailCheck) {
      if (validators.email(identifier)) {
        toast.error('Invalid email format');
        return;
      }
      setChannel('email');
      sendBackendOtp('email');
    } else {
      // Must be phone
      const phoneDigits = identifier.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      setChannel('whatsapp');
      sendBackendOtp('whatsapp');
    }
  };

  const sendBackendOtp = async (selectedChannel) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/passwordless/send-otp', {
        identifier,
        channel: selectedChannel
      });
      toast.success(data.message);
      setStep('otp');
      setCooldown(30);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };



  const handleOtpChange = (index, val) => {
    if (!/^[0-9]*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setLoading(true);

    try {
      const res = await API.post('/auth/passwordless/verify-otp', { identifier, otp: code });
      handleAuthSuccess(res.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleAuthSuccess = (data) => {
    if (data.isNewUser) {
      setTempToken(data.tempToken);
      if (!data.isEmail) {
        setNewUserDetails(prev => ({ ...prev, phone: data.identifier }));
      }
      setStep('complete');
      toast.success('OTP verified! Please complete your profile.');
    } else {
      // Existing User Login
      localStorage.setItem('user', JSON.stringify(data));
      updateUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      redirectUser(data);
    }
  };

  const completeRegistration = async (e) => {
    e.preventDefault();
    if (!newUserDetails.name) {
      toast.error('Name is required');
      return;
    }
    if (!isEmail && !newUserDetails.email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/passwordless/complete-registration', {
        tempToken,
        name: newUserDetails.name,
        email: newUserDetails.email,
        phone: identifier // If they started with phone
      });
      localStorage.setItem('user', JSON.stringify(data));
      updateUser(data);
      
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'CompleteRegistration', { content_name: 'Passwordless Registration' });
      }
      toast.success('Account created successfully!');
      redirectUser(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete registration');
    }
    setLoading(false);
  };

  const redirectUser = (data) => {
    setTimeout(() => {
      if (data.role === 'admin' || data.role === 'admin_marketing') {
        navigate('/admin');
      } else if (data.role === 'marketing') {
        navigate('/marketing');
      } else if (cartItems.length > 0) {
        navigate('/checkout');
      } else {
        navigate('/');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 pt-32 pb-24">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <AnimatePresence mode="wait">

            {step === 'identifier' && (
              <motion.div key="identifier" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-heading font-bold text-secondary">{isRegister ? 'Join Us' : 'Welcome Back'}</h1>
                  <p className="text-gray-500 mt-2">Sign in or create an account with OTP</p>
                </div>
                <form onSubmit={handleIdentifierSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Email or Phone Number</label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                      placeholder="e.g. your@email.com or 9876543210"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full text-lg">Continue</button>
                </form>
              </motion.div>
            )}



            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-accent/10">
                      {channel === 'whatsapp' ? <IoLogoWhatsapp className="w-7 h-7 text-green-500" /> :
                       channel === 'email' ? <HiOutlineMail className="w-7 h-7 text-accent" /> :
                       <HiOutlineChatAlt2 className="w-7 h-7 text-blue-500" />}
                    </div>
                  </div>
                  <h1 className="text-2xl font-heading font-bold text-secondary">Enter Verification Code</h1>
                  <p className="text-gray-500 mt-2 text-sm">
                    We sent a 6-digit code to <strong className="text-secondary">{identifier}</strong>
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-primary"
                    />
                  ))}
                </div>

                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                  className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify Code'}
                </button>

                <div className="text-center mt-5">
                  <button
                    onClick={() => sendBackendOtp(channel)}
                    disabled={cooldown > 0 || loading}
                    className="text-sm text-accent font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
                <button onClick={() => { setStep('identifier'); setOtp(['', '', '', '', '', '']); }} className="w-full mt-4 text-center text-sm text-gray-500 hover:text-secondary">
                  ← Change {isEmail ? 'Email' : 'Number'}
                </button>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-100">
                    <HiOutlineShieldCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary">One Last Step!</h2>
                  <p className="text-gray-500 mt-2 text-sm">Please complete your profile to continue.</p>
                </div>
                <form onSubmit={completeRegistration} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newUserDetails.name}
                      onChange={e => setNewUserDetails(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="Your full name"
                    />
                  </div>
                  {!isEmail && (
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-1">Email Address</label>
                      <input
                        type="email"
                        value={newUserDetails.email}
                        onChange={e => setNewUserDetails(p => ({ ...p, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                        placeholder="your@email.com"
                      />
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary w-full text-lg mt-2 disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PasswordlessAuth;
