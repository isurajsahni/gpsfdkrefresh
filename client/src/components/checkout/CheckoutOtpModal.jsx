import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../utils/api';
import toast from 'react-hot-toast';

/**
 * Checkout OTP modal.
 *
 * Verifies that the contact details the buyer entered (phone + optional email)
 * are real before letting them proceed to payment. Calls the existing dual-
 * channel endpoint `POST /api/whatsapp-otp/send` which fires the same OTP to
 * both WhatsApp and the buyer's email — the buyer can confirm with whichever
 * arrives first.
 *
 * Props:
 *   isOpen     — boolean
 *   onClose    — () => void
 *   onVerified — () => void  (called once verify succeeds; caller advances flow)
 *   phone      — string (full E.164 / digits-only is fine; we strip non-digits)
 *   email      — optional string
 */
const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 6;

const CheckoutOtpModal = ({ isOpen, onClose, onVerified, phone, email }) => {
  const [step, setStep] = useState('sending'); // 'sending' | 'enter' | 'verifying' | 'done' | 'failed'
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [channels, setChannels] = useState([]); // ['whatsapp','email'] — succeeded
  const [failures, setFailures] = useState([]); // [{channel,reason}] — failed channels
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // The server's /whatsapp-otp endpoints expect a digits-only string.
  const cleanedPhone = (phone || '').replace(/\D/g, '');

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendOtp = useCallback(async () => {
    setStep('sending');
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    try {
      const { data } = await API.post('/whatsapp-otp/send', {
        phoneNumber: cleanedPhone,
        email: email || undefined,
      });
      setChannels(data.channels || []);
      // Partial failures: e.g., WhatsApp worked but email did not, or vice-versa.
      setFailures(Array.isArray(data.failures) ? data.failures : []);
      setStep('enter');
      startCooldown();
      // Focus first input
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      const msg = data.message || 'Could not send verification code. Please try again.';
      setError(msg);
      // Server returns 502 when ALL channels failed and includes per-channel reasons.
      // Switch to a dedicated failure state so the user sees why and how to recover.
      if (status === 502 && Array.isArray(data.channels)) {
        setFailures(data.channels);
        setStep('failed');
      } else if (status === 503) {
        // OTP service not configured server-side.
        setStep('failed');
      } else {
        setStep('enter');
        if (status === 429) startCooldown();
      }
    }
  }, [cleanedPhone, email, startCooldown]);

  // Fire send on open. Reset on close.
  useEffect(() => {
    if (isOpen) {
      sendOtp();
    } else {
      // Cleanup
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setStep('sending');
      setResendCooldown(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isOpen, sendOtp]);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    // Auto-submit when full
    if (next.every((d) => d !== '') && digit) {
      handleVerify(next.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      } else {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''));
      setTimeout(() => handleVerify(pasted), 30);
    }
  };

  const handleVerify = async (codeOverride) => {
    const code = codeOverride || otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setStep('verifying');
    setError('');
    try {
      await API.post('/whatsapp-otp/verify', {
        phoneNumber: cleanedPhone,
        otp: code,
      });
      setStep('done');
      toast.success('Verified — taking you to payment');
      // Small delay so the user sees the success state
      setTimeout(() => {
        onVerified();
      }, 400);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired code.';
      setError(msg);
      setStep('enter');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 60);
    }
  };

  if (!isOpen) return null;

  // What we show under the title — list the channels that actually succeeded.
  // Before /send completes we just say "We're sending…"; after, we show the
  // channels the server reports as successfully delivered.
  const channelLabel = (() => {
    if (channels.length >= 2) return 'WhatsApp & Email';
    if (channels[0] === 'whatsapp') return 'WhatsApp';
    if (channels[0] === 'email') return 'Email';
    return null;
  })();

  // Mask the phone (e.g. +91 79733•••875) for display
  const maskedPhone = cleanedPhone
    ? `+${cleanedPhone.slice(0, cleanedPhone.length - 8)} ${cleanedPhone.slice(-10, -6)}•••${cleanedPhone.slice(-3)}`
    : '';
  const maskedEmail = email ? email.replace(/(.{2}).+(@.+)/, '$1•••$2') : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="relative px-6 pt-6 pb-5 text-center"
            style={{ background: 'linear-gradient(135deg, #0B5D3B 0%, #128C7E 100%)' }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">🔒</div>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Confirm it's really you</h2>
            <p className="text-white/80 text-xs">
              {channelLabel
                ? <>We sent a 6-digit code via <span className="font-semibold">{channelLabel}</span></>
                : step === 'sending'
                  ? 'Sending a 6-digit code…'
                  : 'Enter the 6-digit code we sent you'}
            </p>
            <div className="mt-2 text-[11px] text-white/70 leading-relaxed">
              {maskedPhone && <div>📱 {maskedPhone}</div>}
              {maskedEmail && <div>✉️ {maskedEmail}</div>}
            </div>
            {/* If the server reported partial delivery (e.g. WhatsApp failed,
                email worked), nudge the user where to look. */}
            {step === 'enter' && failures.length > 0 && channels.length > 0 && (
              <p className="mt-2 text-[10px] text-white/90 bg-black/20 rounded px-2 py-1 inline-block">
                Heads up: {failures.map(f => f.channel).join(', ')} didn't deliver — please check {channels.join(' / ')}.
              </p>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {step === 'sending' ? (
              <div className="flex items-center justify-center py-6 text-gray-500 text-sm">
                <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending code…
              </div>
            ) : step === 'failed' ? (
              <div className="text-center py-2">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-sm font-semibold text-red-600 mb-2">
                  We couldn't send your verification code.
                </p>
                <p className="text-xs text-gray-500 mb-4">{error}</p>
                {failures.length > 0 && (
                  <ul className="text-[11px] text-left text-gray-500 bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                    {failures.map((f, i) => (
                      <li key={i}>
                        <span className="font-semibold capitalize">{f.channel}:</span>{' '}
                        <span className="text-gray-600">{f.reason || 'unknown error'}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={sendOtp}
                    className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Try again
                  </button>
                  <a
                    href="https://wa.me/916280310103"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-10 rounded-xl bg-accent text-white text-sm font-semibold flex items-center justify-center"
                  >
                    Contact support
                  </a>
                </div>
              </div>
            ) : (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Enter 6-digit code
                </label>
                <div className="flex justify-center gap-1.5 sm:gap-2 mb-4" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={step === 'verifying' || step === 'done'}
                      className={`w-10 h-11 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-xl border-2 transition-all focus:outline-none ${
                        digit
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-900 focus:border-accent focus:bg-accent/5'
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-center text-xs text-red-500 mb-3">⚠ {error}</p>
                )}

                <button
                  onClick={() => handleVerify()}
                  disabled={step === 'verifying' || step === 'done' || otp.some((d) => !d)}
                  className="w-full h-11 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                  style={{ background: 'linear-gradient(135deg, #0B5D3B 0%, #128C7E 100%)' }}
                >
                  {step === 'verifying' ? 'Verifying…' : step === 'done' ? '✓ Verified' : 'Verify & continue'}
                </button>

                <div className="text-center text-xs text-gray-500">
                  Didn't get it?{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400">Resend in <span className="font-semibold">{resendCooldown}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      className="text-accent font-semibold hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 text-center">
            <p className="text-[11px] text-gray-400">Code expires in 5 minutes</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutOtpModal;
