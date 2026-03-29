import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { validators, formatters, sanitize } from '../utils/validation';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBlur = (field, value) => {
    const error = validators[field] ? validators[field](value) : '';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (formatters[field]) formattedValue = formatters[field](value);
    
    if (field === 'email') setEmail(formattedValue);
    if (field === 'otp') setOtp(formattedValue);
    if (field === 'newPassword') setNewPassword(formattedValue);

    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const emailError = validators.email(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = sanitize(email);
      const res = await API.post('/auth/forgot-password', { email: cleanEmail });
      toast.success(res.data.message || 'OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpError = validators.otp(otp);
    if (otpError) {
      setErrors({ otp: otpError });
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email: sanitize(email), otp });
      toast.success(res.data.message || 'OTP verified');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const passwordError = validators.password(newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }

    setLoading(true);
    try {
      const res = await API.put('/auth/reset-password', { 
        email: sanitize(email), 
        otp, 
        newPassword 
      });
      toast.success(res.data.message || 'Password reset successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
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
        <div className="glass-card p-8 md:p-10 relative overflow-hidden">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-secondary">Reset Password</h1>
            <p className="text-gray-500 mt-2">
              {step === 1 && 'Enter your email to receive a recovery code'}
              {step === 2 && 'Enter the 6-digit code sent to your email'}
              {step === 3 && 'Choose a new strong password'}
            </p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOtp}
                  className="space-y-5"
                  noValidate
                >
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Email</label>
                    <input
                      type="email" 
                      value={email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      className={`w-full px-5 py-3.5 bg-primary border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || errors.email} 
                    className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Recovery Code'}
                  </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                  noValidate
                >
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">6-Digit OTP</label>
                    <input
                      type="text" 
                      value={otp}
                      onChange={(e) => handleChange('otp', e.target.value)}
                      onBlur={(e) => handleBlur('otp', e.target.value)}
                      className={`w-full px-5 py-3.5 bg-primary border ${errors.otp ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-center tracking-widest text-lg font-bold`}
                      placeholder="••••••"
                    />
                    {errors.otp && <p className="text-red-500 text-xs mt-1 font-medium text-center">{errors.otp}</p>}
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || otp.length < 6 || errors.otp} 
                    className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleResetPassword}
                  className="space-y-5"
                  noValidate
                >
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">New Password</label>
                    <input
                      type="password" 
                      value={newPassword}
                      onChange={(e) => handleChange('newPassword', e.target.value)}
                      onBlur={(e) => handleBlur('newPassword', e.target.value)}
                      className={`w-full px-5 py-3.5 bg-primary border ${errors.newPassword ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
                      placeholder="••••••••"
                    />
                    {errors.newPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.newPassword}</p>}
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || errors.newPassword} 
                    className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Set New Password'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Remembered your password? <Link to="/login" className="text-accent font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
