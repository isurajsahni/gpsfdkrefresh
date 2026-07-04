import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SEO from '../components/seo/SEO';
import API from '../utils/api';

const WhatsAppLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sentChannels, setSentChannels] = useState([]);

  // Handle cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      return toast.error('Please enter a valid phone number');
    }

    setLoading(true);
    try {
      const body = { phoneNumber };
      if (email.trim()) body.email = email.trim();

      // Shared API client — same normalized HTTPS base URL as the rest of the
      // app (the old hardcoded localhost fallback caused mixed-content requests
      // whenever the env var was missing).
      const { data } = await API.post('/whatsapp-otp/send', body);

      setSentChannels(data.channels || []);
      const channelText = data.channels?.join(' & ') || 'WhatsApp';
      toast.success(`OTP sent via ${channelText}!`);
      setStep(2);
      setCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
      console.error(err);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error('Enter 6-digit OTP');
    }

    setLoading(true);
    try {
      await API.post('/whatsapp-otp/verify', { phoneNumber, otp });
      toast.success('Verified successfully! 🎉');
      // Here you would typically log the user in (save JWT, redirect, etc.)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 pt-32 pb-24">
      <SEO title="WhatsApp Login | GPSFDK" noindex />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-secondary">Verify Your Identity</h1>
            <p className="text-gray-500 mt-2">
              {step === 1
                ? 'Enter your details to receive a verification code'
                : 'Enter the 6-digit code sent to your WhatsApp & Email'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="e.g. 917973386875"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Include country code (e.g., 91 for India)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Email <span className="text-gray-400 font-normal">(optional — OTP sent here too)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="btn-primary w-full text-lg disabled:opacity-50"
              >
                {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* Channel badges */}
              {sentChannels.length > 0 && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  {sentChannels.includes('whatsapp') && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                      ✓ WhatsApp
                    </span>
                  )}
                  {sentChannels.includes('email') && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                      ✓ Email
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">OTP Code</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl text-center text-2xl tracking-widest focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="000000"
                  required
                />
                <p className="text-xs text-gray-400 mt-2 text-center">Check your WhatsApp or Email for the code</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setSentChannels([]); }}
                  className="text-sm text-gray-500 hover:text-secondary font-medium transition-colors"
                >
                  ← Change details
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleSendOtp}
                  className="text-sm text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-xs">
              The same verification code will be sent to both your WhatsApp and email.
              You can use either one to verify.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WhatsAppLogin;
