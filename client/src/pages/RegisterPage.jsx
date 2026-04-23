import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validators, formatters } from '../utils/validation';
import API from '../utils/api';
import toast from 'react-hot-toast';
import SmartPhoneInput from '../components/common/SmartPhoneInput';
import { HiOutlineShieldCheck, HiOutlineMail } from 'react-icons/hi';
import { IoLogoWhatsapp } from 'react-icons/io5';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // OTP state
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef([]);

  const { updateUser } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }
  }, [step]);

  const handleBlur = (field) => {
    const error = validators[field](form[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (formatters[field]) formattedValue = formatters[field](value);
    setForm(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Step 1: Validate form and send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      name: validators.fullName(form.name),
      email: validators.email(form.email),
      phone: validators.phone(form.phone),
      password: validators.password(form.password),
    };

    const hasErrors = Object.values(newErrors).some(err => err !== '');
    if (hasErrors) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/send-registration-otp', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      toast.success(data.message);
      setStep('otp');
      setCooldown(30);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    }
    setLoading(false);
  };

  // OTP input handlers
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

  // Step 2: Verify OTP → create account
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const { data } = await API.post('/auth/verify-registration-otp', {
        email: form.email,
        otp: code,
      });
      // Account created — update auth context
      localStorage.setItem('user', JSON.stringify(data));
      updateUser(data);

      setStep('success');
      toast.success('Account created successfully!');
      // Meta Pixel: CompleteRegistration event on successful account creation
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'CompleteRegistration', {
          content_name: 'User Registration',
          status: true,
        });
        console.log('[Meta Pixel] CompleteRegistration event fired');
      }

      setTimeout(() => {
        if (cartItems.length > 0) {
          navigate('/checkout');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
    setVerifying(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const { data } = await API.post('/auth/send-registration-otp', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      toast.success(data.message);
      setCooldown(30);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    }
    setLoading(false);
  };

  const maskedEmail = form.email?.replace(/(.{2}).+(@.+)/, '$1***$2') || '';

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 pt-32 pb-24">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <AnimatePresence mode="wait">
            {/* ─── Step 1: Registration Form ─── */}
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-heading font-bold text-secondary">Create Account</h1>
                  <p className="text-gray-500 mt-2">Join our luxury community</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      className={`w-full px-5 py-3.5 bg-primary border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-5 py-3.5 bg-primary border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Phone</label>
                    <SmartPhoneInput
                      value={form.phone}
                      onChange={(val) => handleChange('phone', val)}
                      onBlur={() => handleBlur('phone')}
                      error={errors.phone}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      className={`w-full px-5 py-3.5 bg-primary border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                      placeholder="Min 8 characters"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || Object.values(errors).some(e => e !== '')}
                    className="btn-primary w-full text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending Verification Code...' : 'Create Account'}
                  </button>
                </form>
                <p className="mt-6 text-center text-gray-500 text-sm">
                  Already have an account? <Link to="/login" className="text-accent font-semibold hover:underline">Sign In</Link>
                </p>
              </motion.div>
            )}

            {/* ─── Step 2: OTP Verification ─── */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                    >
                      <IoLogoWhatsapp className="w-7 h-7 text-white" />
                    </div>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                    >
                      <HiOutlineMail className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-heading font-bold text-secondary">Verify Your Identity</h1>
                  <p className="text-gray-500 mt-2 text-sm">
                    We sent a 6-digit code to <strong className="text-secondary">{maskedEmail}</strong>
                    {form.phone && <> &amp; your <strong className="text-secondary">WhatsApp</strong></>}
                  </p>

                  {/* Channel badges */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                      <IoLogoWhatsapp className="w-3.5 h-3.5" /> WhatsApp
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                      <HiOutlineMail className="w-3.5 h-3.5" /> Email
                    </span>
                    {form.phone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                        ✓ Sent
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs font-bold text-accent bg-accent/5 py-1 px-3 rounded-full inline-block">
                    Check your Spam/Junk folder if not in Inbox
                  </p>
                </div>

                {/* OTP Inputs */}
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
                      style={{ caretColor: 'transparent' }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={verifying || otp.join('').length !== 6}
                  className="btn-primary w-full text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>

                <div className="text-center mt-5">
                  <button
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-sm text-accent font-medium hover:underline disabled:text-gray-400 disabled:no-underline transition-colors"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>

                <button
                  onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); }}
                  className="w-full mt-4 text-center text-sm text-gray-500 hover:text-secondary transition-colors"
                >
                  ← Back to form
                </button>
              </motion.div>
            )}


            {/* ─── Step 3: Success ─── */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <HiOutlineShieldCheck className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-heading font-bold text-secondary mb-2">Welcome to GPSFDK!</h2>
                <p className="text-gray-500">Your account has been created. Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
