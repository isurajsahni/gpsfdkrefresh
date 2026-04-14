import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineSparkles } from 'react-icons/hi';

const COUPON_CODE = 'THE-R2L-SUMMER';
const SESSION_KEY = 'promoPopupShown';
const EXIT_SESSION_KEY = 'promoExitShown';

const PromoPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trigger, setTrigger] = useState(''); // 'entry', 'timer', 'exit'
  const timerRef = useRef(null);
  const exitShownRef = useRef(false);

  // Show popup
  const showPopup = useCallback((triggerType) => {
    setTrigger(triggerType);
    setIsOpen(true);
  }, []);

  // Close popup
  const closePopup = useCallback(() => {
    setIsOpen(false);
    setCopied(false);
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  // Copy coupon code
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = COUPON_CODE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  // 1. Entry popup — show on first visit
  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const entryTimer = setTimeout(() => {
        showPopup('entry');
        sessionStorage.setItem(SESSION_KEY, 'true');
      }, 1500); // Small delay for page to settle
      return () => clearTimeout(entryTimer);
    }
  }, [showPopup]);

  // 2. Timer popup — 8 seconds of interaction
  useEffect(() => {
    const startTimer = () => {
      if (timerRef.current) return;
      timerRef.current = setTimeout(() => {
        if (!isOpen && sessionStorage.getItem(SESSION_KEY)) {
          showPopup('timer');
        }
      }, 8000);
    };

    // Start timer on user interaction
    const events = ['click', 'scroll', 'mousemove', 'touchstart'];
    const handler = () => {
      startTimer();
      // Remove listeners after first interaction
      events.forEach(e => window.removeEventListener(e, handler));
    };

    events.forEach(e => window.addEventListener(e, handler, { once: true, passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, handler));
    };
  }, [isOpen, showPopup]);

  // 3. Exit intent popup — mouse leaves viewport
  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (
        e.clientY <= 0 &&
        !isOpen &&
        !exitShownRef.current &&
        !sessionStorage.getItem(EXIT_SESSION_KEY)
      ) {
        exitShownRef.current = true;
        sessionStorage.setItem(EXIT_SESSION_KEY, 'true');
        showPopup('exit');
      }
    };

    document.addEventListener('mouseout', handleMouseLeave);
    return () => document.removeEventListener('mouseout', handleMouseLeave);
  }, [isOpen, showPopup]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Decorative top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-[#F15A29] via-[#FFD700] to-[#0B5D3B]" />

              {/* Close button */}
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>

              <div className="px-6 pt-6 pb-8 text-center">
                {/* Sparkle icon */}
                <motion.div
                  initial={{ rotate: -15 }}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F15A29]/10 to-[#FFD700]/10 rounded-2xl mb-4"
                >
                  <HiOutlineSparkles className="w-8 h-8 text-[#F15A29]" />
                </motion.div>

                {/* Heading */}
                <h2 className="text-xl sm:text-2xl font-bold text-[#0B5D3B] font-heading leading-tight mb-2">
                  {trigger === 'exit' ? 'Wait! Don\'t Miss This!' : '🎉 Exclusive Offer!'}
                </h2>

                {/* Subtitle */}
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Get a chance to win an <span className="font-bold text-[#0B5D3B]">International Trip</span> + <span className="font-bold text-[#F15A29]">FLAT 10% OFF</span> on your order!
                </p>

                {/* Coupon Code Box */}
                <div className="relative mb-5">
                  <div className="flex items-center justify-center gap-0 bg-[#0B5D3B]/5 border-2 border-dashed border-[#0B5D3B]/30 rounded-2xl overflow-hidden">
                    <div className="flex-1 py-4 px-4">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Use Coupon Code</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#0B5D3B] tracking-wider font-heading select-all">
                        {COUPON_CODE}
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`h-full px-5 py-4 flex flex-col items-center justify-center gap-1 border-l-2 border-dashed border-[#0B5D3B]/30 transition-all duration-300 ${
                        copied
                          ? 'bg-green-50 text-green-600'
                          : 'bg-white hover:bg-[#F15A29]/5 text-[#0B5D3B]'
                      }`}
                    >
                      {copied ? (
                        <>
                          <HiOutlineCheck className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <HiOutlineClipboardCopy className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  to="/wall-canvas"
                  onClick={closePopup}
                  className="inline-block w-full py-3.5 px-6 bg-gradient-to-r from-[#0B5D3B] to-[#0a4f33] text-white font-bold rounded-xl text-sm tracking-wide hover:shadow-lg hover:shadow-[#0B5D3B]/20 hover:-translate-y-0.5 transition-all duration-300"
                >
                  SHOP WALL CANVAS NOW →
                </Link>

                {/* T&C */}
                <p className="text-[10px] text-gray-400 mt-3">*T&C Apply</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PromoPopup;
