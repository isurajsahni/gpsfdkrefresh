import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import SmartPhoneInput from '../common/SmartPhoneInput';

const RESEND_COOLDOWN = 30; // seconds
const MAX_ATTEMPTS = 3;
const OTP_LENGTH = 6;

const WhatsAppOtpModal = ({ isOpen, onClose, onVerified, phone: initialPhone }) => {
  const [phone, setPhone] = useState(initialPhone || '');
  const [phoneEditable, setPhoneEditable] = useState(!initialPhone);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [locked, setLocked] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // Start resend countdown
  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPhone(initialPhone || '');
      setPhoneEditable(!initialPhone);
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep('phone');
      setError('');
      setRequestId(null);
      setAttemptsLeft(MAX_ATTEMPTS);
      setLocked(false);
      setResendCooldown(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isOpen, initialPhone]);

  // Auto-focus first OTP box when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleSendOtp = async () => {
    // Validate minimum acceptable length globally
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 6) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/whatsapp-otp/send', { phone: cleaned });
      setRequestId(data.requestId);
      setStep('otp');
      startCooldown();
      toast.success(data.message || 'OTP sent via WhatsApp!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(msg);
      if (err.response?.data?.retryAfter) {
        setResendCooldown(err.response.data.retryAfter);
        startCooldown();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/whatsapp-otp/resend');
      if (data.requestId) setRequestId(data.requestId);
      setOtp(Array(OTP_LENGTH).fill(''));
      setAttemptsLeft(MAX_ATTEMPTS);
      setLocked(false);
      startCooldown();
      toast.success(data.message || 'OTP resent!');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every(d => d !== '') && digit) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const arr = pasted.split('');
      setOtp(arr);
      setTimeout(() => handleVerifyOtp(pasted), 50);
    }
  };

  const handleVerifyOtp = async (otpString) => {
    if (locked) return;
    const otpValue = otpString || otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/whatsapp-otp/verify', { otp: otpValue, requestId });
      toast.success('Phone verified successfully! ✓');
      onVerified(data.verifiedToken, phone.replace(/\D/g, ''));
    } catch (err) {
      const res = err.response?.data;
      const msg = res?.message || 'Incorrect OTP. Please try again.';
      setError(msg);
      if (res?.locked) {
        setLocked(true);
        setAttemptsLeft(0);
      } else if (res?.attemptsRemaining !== undefined) {
        setAttemptsLeft(res.attemptsRemaining);
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 text-center"
              style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none transition-colors"
                aria-label="Close"
              >
                ×
              </button>
              {/* WhatsApp Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {step === 'phone' ? 'Verify Your Phone' : 'Enter OTP'}
              </h2>
              <p className="text-white/80 text-sm">
                {step === 'phone'
                  ? 'We\'ll send a one-time password via WhatsApp'
                  : `Code sent to ${phone}`
                }
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <AnimatePresence mode="wait">
                {step === 'phone' ? (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="flex items-center gap-2 mb-4">
                      {phoneEditable ? (
                        <div className="flex-1 w-full">
                          <SmartPhoneInput
                            value={phone}
                            onChange={(val) => {
                              setPhone(val);
                              setError('');
                            }}
                            error={''}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 h-12">
                          <span className="text-gray-900 font-medium tracking-wide">{phone}</span>
                          <button
                            onClick={() => setPhoneEditable(true)}
                            className="text-xs text-green-600 font-semibold hover:underline whitespace-nowrap"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mb-4 flex items-center gap-1"
                      >
                        <span>⚠</span> {error}
                      </motion.p>
                    )}

                    <button
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending OTP...
                        </>
                      ) : (
                        'Send OTP via WhatsApp'
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* OTP Boxes */}
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                      Enter 6-digit OTP
                    </label>
                    <div
                      className="flex justify-center gap-2 mb-4"
                      onPaste={handleOtpPaste}
                    >
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
                          disabled={locked || loading}
                          className={`w-11 h-12 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none
                            ${locked ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
                              : digit ? 'border-green-400 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-900 focus:border-green-400 focus:bg-green-50/30'}
                          `}
                        />
                      ))}
                    </div>

                    {/* Error / lock message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`text-center text-xs mb-3 px-3 py-2 rounded-lg ${
                            locked ? 'bg-red-50 text-red-600 border border-red-100' : 'text-red-500'
                          }`}
                        >
                          {locked ? (
                            <span>🔒 {error}</span>
                          ) : (
                            <span>
                              ⚠ {error}
                              {attemptsLeft > 0 && (
                                <span className="ml-1 font-medium">({attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left)</span>
                              )}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Verify Button */}
                    {!locked && (
                      <button
                        onClick={() => handleVerifyOtp()}
                        disabled={loading || otp.some(d => !d)}
                        className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
                        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          '✓ Verify & Place Order'
                        )}
                      </button>
                    )}

                    {/* Resend Section */}
                    <div className="text-center">
                      {locked ? (
                        <button
                          onClick={() => {
                            setStep('phone');
                            setOtp(Array(OTP_LENGTH).fill(''));
                            setLocked(false);
                            setAttemptsLeft(MAX_ATTEMPTS);
                            setError('');
                            clearInterval(timerRef.current);
                            setResendCooldown(0);
                          }}
                          className="text-green-600 text-sm font-semibold hover:underline"
                        >
                          ← Request a new OTP
                        </button>
                      ) : (
                        <p className="text-gray-500 text-xs">
                          Didn't receive it?{' '}
                          {resendCooldown > 0 ? (
                            <span className="text-gray-400">Resend in <span className="font-semibold text-gray-600">{resendCooldown}s</span></span>
                          ) : (
                            <button
                              onClick={handleResendOtp}
                              disabled={loading}
                              className="text-green-600 font-semibold hover:underline disabled:opacity-50"
                            >
                              Resend OTP
                            </button>
                          )}
                        </p>
                      )}
                      {!locked && (
                        <button
                          onClick={() => { setStep('phone'); setError(''); setOtp(Array(OTP_LENGTH).fill('')); }}
                          className="text-gray-400 text-xs mt-2 hover:text-gray-600 hover:underline"
                        >
                          ← Change phone number
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Trust Signal */}
            <div className="px-6 pb-5 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-gray-400"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                Secured by MSG91 · OTP expires in 10 minutes
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppOtpModal;
