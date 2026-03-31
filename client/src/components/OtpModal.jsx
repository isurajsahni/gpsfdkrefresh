import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiShieldCheck } from 'react-icons/hi';
import API from '../utils/api';
import toast from 'react-hot-toast';

/**
 * OtpModal — Premium OTP verification modal
 *
 * Props:
 *   type: 'phone' | 'email'
 *   value: the new phone number or email to verify
 *   isOpen: boolean
 *   onClose: () => void
 *   onVerified: (token, value) => void — called with verifiedToken + the verified value
 */
const OtpModal = ({ type = 'phone', value, isOpen, onClose, onVerified }) => {
  const [step, setStep] = useState('send'); // 'send' | 'verify' | 'success'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [requestId, setRequestId] = useState(null);
  const inputRefs = useRef([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('send');
      setOtp(['', '', '', '', '', '']);
      setSending(false);
      setVerifying(false);
      setCooldown(0);
      setRequestId(null);
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-focus first OTP input when entering verify step
  useEffect(() => {
    if (step === 'verify' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [step]);

  const handleSendOtp = async () => {
    setSending(true);
    try {
      if (type === 'phone') {
        const { data } = await API.post('/whatsapp-otp/send', { phone: value });
        setRequestId(data.requestId);
        toast.success(data.message);
      } else {
        const { data } = await API.post('/auth/send-email-update-otp', { newEmail: value });
        toast.success(data.message);
      }
      setStep('verify');
      setCooldown(30);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setSending(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setSending(true);
    try {
      if (type === 'phone') {
        const { data } = await API.post('/whatsapp-otp/resend');
        setRequestId(data.requestId);
        toast.success(data.message);
      } else {
        const { data } = await API.post('/auth/send-email-update-otp', { newEmail: value });
        toast.success(data.message);
      }
      setCooldown(30);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
    setSending(false);
  };

  const handleOtpChange = (index, val) => {
    if (!/^[0-9]*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      if (type === 'phone') {
        const { data } = await API.post('/whatsapp-otp/verify', { otp: code, requestId });
        toast.success(data.message);
        setStep('success');
        setTimeout(() => {
          onVerified(data.verifiedToken, value);
        }, 1200);
      } else {
        const { data } = await API.post('/auth/verify-email-update-otp', { otp: code });
        toast.success(data.message);
        setStep('success');
        setTimeout(() => {
          onVerified(data.emailVerifiedToken, data.newEmail);
        }, 1200);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setVerifying(false);
  };

  if (!isOpen) return null;

  const isPhone = type === 'phone';
  const maskedValue = isPhone
    ? `****${value?.slice(-4) || ''}`
    : value?.replace(/(.{2}).+(@.+)/, '$1***$2') || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-8 pt-8 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: step === 'success'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : isPhone
                        ? 'linear-gradient(135deg, #25D366, #128C7E)'
                        : 'linear-gradient(135deg, #f97316, #ea580c)'
                  }}
                >
                  {step === 'success' ? (
                    <HiShieldCheck className="w-8 h-8 text-white" />
                  ) : (
                    <span className="text-2xl">{isPhone ? '📱' : '📧'}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-heading">
                  {step === 'success'
                    ? 'Verified!'
                    : step === 'verify'
                      ? 'Enter Verification Code'
                      : isPhone
                        ? 'Verify Phone Number'
                        : 'Verify Email Address'}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {step === 'success'
                    ? `Your ${isPhone ? 'phone number' : 'email'} has been verified successfully.`
                    : step === 'verify'
                      ? `We sent a 6-digit code to ${maskedValue}`
                      : `We'll send a verification code to verify your new ${isPhone ? 'phone number' : 'email'}.`}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {step === 'send' && (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    <div className="bg-gray-50 rounded-2xl p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                        {isPhone ? 'Phone Number' : 'Email Address'}
                      </p>
                      <p className="text-lg font-bold text-gray-900">{value}</p>
                    </div>

                    <button
                      onClick={handleSendOtp}
                      disabled={sending}
                      className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-base hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{isPhone ? 'Send OTP via WhatsApp' : 'Send Verification Code'}</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {step === 'verify' && (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    {/* OTP Inputs */}
                    <div className="flex justify-center gap-3" onPaste={handlePaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => (inputRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleKeyDown(i, e)}
                          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-gray-50"
                          style={{ caretColor: 'transparent' }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={verifying || otp.join('').length !== 6}
                      className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-base hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {verifying ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Verify Code'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        onClick={handleResend}
                        disabled={cooldown > 0 || sending}
                        className="text-sm text-accent font-medium hover:underline disabled:text-gray-400 disabled:no-underline transition-colors"
                      >
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                      <HiShieldCheck className="w-10 h-10 text-white" />
                    </motion.div>
                    <p className="text-gray-500 text-sm">Applying changes...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OtpModal;
