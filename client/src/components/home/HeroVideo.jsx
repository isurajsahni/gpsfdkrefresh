import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import WebflowButton from '../ui/WebflowButton';

const HeroVideo = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center py-32">
      {/* Background Image (formerly video) */}
      <img
        className="absolute inset-0 w-full h-full object-cover"
        src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920"
        alt="Premium Home Decor"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full text-center px-4">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-accent font-body text-sm md:text-base tracking-[0.3em] uppercase mb-4"
        >
          Premium Home Décor
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white max-w-4xl leading-tight"
        >
          Elevate Your Space <br />
          <span className="text-accent">With Art & Identity</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-white/70 text-lg md:text-xl max-w-2xl mt-6 font-body"
        >
          Discover luxury wall canvases & custom house nameplates that transform your home into a masterpiece.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-10 items-center flex flex-col sm:flex-row gap-4"
        >
          <WebflowButton to="/category/wall-canvas" className="text-lg">
            Shop Now
          </WebflowButton>
          <Link to="/category/house-nameplates" className="btn-outline border-white text-white hover:bg-white hover:text-secondary text-lg px-10 py-4">
            Custom Nameplates
          </Link>
        </motion.div>

      </div>

      {/* Scroll indicator - Moved outside relative container to align to screen bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 z-20 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1.5"
        >
          <div className="w-1.5 h-3 bg-white/60 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroVideo;
