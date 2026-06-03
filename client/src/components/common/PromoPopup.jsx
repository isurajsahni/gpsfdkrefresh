import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineSparkles } from 'react-icons/hi';

const COUPON_CODE = '';
const NEVER_SHOW_KEY = 'coupon_popup_never';
const LAST_SHOWN_KEY = 'coupon_popup_timestamp';

const PromoPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trigger, setTrigger] = useState(''); // 'entry', 'timer', 'exit'
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const timerRef = useRef(null);
  const exitShownRef = useRef(false);
  const location = useLocation();

  // Helper to check if we should show popup based on localStorage conditions
  const shouldShowPopup = useCallback(() => {
    if (localStorage.getItem(NEVER_SHOW_KEY) === 'true') {
      return false;
    }
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    if (lastShown) {
      const now = Date.now();
      const diff = now - parseInt(lastShown, 10);
      const hours24 = 24 * 60 * 60 * 1000;
      if (diff < hours24) {
        return false;
      }
    }
    return true;
  }, []);

  // Show popup
  const showPopup = useCallback((triggerType) => {
    if (!shouldShowPopup()) return;
    setTrigger(triggerType);
    setIsOpen(true);
  }, [shouldShowPopup]);

  // Close popup
  const closePopup = useCallback(() => {
    setIsOpen(false);
    setCopied(false);
    if (dontShowAgain) {
      localStorage.setItem(NEVER_SHOW_KEY, 'true');
    } else {
      localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString());
    }
  }, [dontShowAgain]);

  const handleDontShowChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

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

  // Check route: NEVER show on checkout
  const isCheckout = location.pathname.includes('/checkout');

  // Force close if we navigate to checkout while open
  useEffect(() => {
    if (isCheckout && isOpen) {
      setIsOpen(false);
    }
  }, [isCheckout, isOpen]);

  // 1. Entry popup — show on first visit
  useEffect(() => {
    if (isCheckout || !shouldShowPopup()) return;
    
    // Only attempt entry popup if it hasn't been shown in this session at all
    if (!sessionStorage.getItem('promo_entry_attempted')) {
      const entryTimer = setTimeout(() => {
        showPopup('entry');
        sessionStorage.setItem('promo_entry_attempted', 'true');
      }, 15000); // 15 second delay before showing entry popup
      return () => clearTimeout(entryTimer);
    }
  }, [showPopup, isCheckout, shouldShowPopup]);

  // 2. Timer popup — 20 seconds of interaction
  useEffect(() => {
    if (isCheckout || !shouldShowPopup()) return;

    const startTimer = () => {
      if (timerRef.current) return;
      timerRef.current = setTimeout(() => {
        if (!isOpen && shouldShowPopup()) {
          showPopup('timer');
        }
      }, 20000); // Changed to 20 seconds
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
  }, [isOpen, showPopup, isCheckout, shouldShowPopup]);

  // 3. Exit intent popup — mouse leaves viewport
  useEffect(() => {
    if (isCheckout || !shouldShowPopup()) return;

    const handleMouseLeave = (e) => {
      if (
        e.clientY <= 0 &&
        !isOpen &&
        !exitShownRef.current &&
        shouldShowPopup()
      ) {
        exitShownRef.current = true;
        showPopup('exit');
      }
    };

    document.addEventListener('mouseout', handleMouseLeave);
    return () => document.removeEventListener('mouseout', handleMouseLeave);
  }, [isOpen, showPopup, isCheckout, shouldShowPopup]);

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

              <div className="px-6 pt-6 pb-6 text-center">
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
                  className="inline-block w-full py-3.5 px-6 bg-gradient-to-r from-[#0B5D3B] to-[#0a4f33] text-white font-bold rounded-xl text-sm tracking-wide hover:shadow-lg hover:shadow-[#0B5D3B]/20 hover:-translate-y-0.5 transition-all duration-300 mb-3"
                >
                  SHOP CANVAS NOW →
                </Link>

                {/* Don't show again Option */}
                <div className="flex items-center justify-center gap-2 mt-2 mb-1">
                  <input 
                    type="checkbox" 
                    id="dont-show-again"
                    checked={dontShowAgain}
                    onChange={handleDontShowChange}
                    className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                  />
                  <label htmlFor="dont-show-again" className="text-xs text-gray-500 cursor-pointer">
                    Don't show this again
                  </label>
                </div>

                {/* T&C */}
                <p className="text-[10px] text-gray-400 mt-2">*T&C Apply</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PromoPopup;
