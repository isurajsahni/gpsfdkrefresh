import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../utils/api';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email, otp });
      toast.success(res.data.message || 'OTP verified');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await API.put('/auth/reset-password', { email, otp, newPassword });
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
                >
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Email</label>
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full text-lg disabled:opacity-50">
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
                >
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">6-Digit OTP</label>
                    <input
                      type="text" required value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-center tracking-widest text-lg font-bold"
                      placeholder="••••••"
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full text-lg disabled:opacity-50">
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
                >
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">New Password</label>
                    <input
                      type="password" required value={newPassword} minLength={6}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full text-lg disabled:opacity-50">
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
