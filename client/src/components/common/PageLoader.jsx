import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PageLoader = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // 1. Simulate progress for the progress bar
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2; // Smooth gradual progress
      });
    }, 30);

    // 2. Hide loader when window is fully loaded or after max 2.5s
    const handleLoad = () => {
      setTimeout(() => setIsVisible(false), 800); // Small delay for smooth exit
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Safety timeout to ensure user isn't stuck
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Animation variants
  const containerVariants = {
    exit: {
      opacity: 0,
      scale: 1.05,
      filter: 'blur(15px) saturate(0.5)', // Cinematic blur with slight desaturation
      transition: {
        duration: 1.2,
        ease: [0.6, -0.05, 0.01, 0.9], // Dramatic, smooth ease
      },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        staggerChildren: 0.1, // Reveal letters sequentially
      }
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  const brandName = "GPSFDK";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loader-container"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #0B5D3B 0%, #094a2f 100%)'
          }}
        >
          {/* subtle background animation - floating particles/luxury dust */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: 0
                }}
                animate={{
                  y: [null, Math.random() * -100],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                  className="absolute w-1 h-1 bg-[#F15A29] rounded-full blur-[1px]"
              />
            ))}
          </div>

          {/* Logo/Brand Reveal */}
          <motion.div
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col items-center"
          >
            <div className="flex space-x-2 md:space-x-4">
              {brandName.split("").map((letter, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="text-4xl md:text-7xl font-cinzel font-bold tracking-widest drop-shadow-[0_0_20px_rgba(241,90,41,0.2)] bg-gradient-to-b from-[#FFF7E7] via-[#D4AF37] to-[#F15A29] bg-clip-text text-transparent"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.2em' }}
              animate={{ opacity: 0.6, letterSpacing: '0.5em' }}
              transition={{ delay: 1, duration: 2 }}
              className="mt-4 text-[10px] md:text-sm text-[#FFF7E7] uppercase font-light tracking-[0.5em]"
            >
              Luxury Refined
            </motion.p>
          </motion.div>

          {/* Progress Bar (Bottom) */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${loadingProgress}%` }}
              className="h-full bg-[#F15A29] shadow-[0_0_10px_#F15A29]"
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>

          {/* Soft Glow overlay that moves slightly */}
          <motion.div 
            animate={{
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-radial-gradient from-[#F15A29]/5 to-transparent pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
