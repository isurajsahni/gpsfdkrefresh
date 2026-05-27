import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import beforeImg from '../../assets/image/home page/before.webp';
import afterImg from '../../assets/image/home page/after.webp';

const BeforeAfterSection = ({ showCTA = true, showTitle = true, compact = false }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const content = (
    <div className="max-w-6xl mx-auto px-2 sm:px-4">
      {/* Section Heading */}
      {showTitle && (
        <div className="text-center mb-10 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-accent font-body text-xs sm:text-sm tracking-[0.3em] uppercase">Before & After</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold text-secondary mt-2 sm:mt-3 px-2">
              Turn Photos Into Timeless Paintings
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-accent mt-[15px] rounded-full mx-auto" />
            <p className="text-gray-600 font-body text-xs sm:text-sm md:text-lg mt-4 sm:mt-6 max-w-2xl mx-auto px-2">
              See the magic of our digital design team. Drag the slider to compare an ordinary client photo with our finished premium canvas print.
            </p>
          </motion.div>
        </div>
      )}

      {/* Image Slider Container */}
      <div className="relative max-w-4xl mx-auto">
        <div
          ref={containerRef}
          className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-xl sm:rounded-[2rem] shadow-2xl border border-cream-dark select-none cursor-ew-resize"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            setSliderPosition((x / rect.width) * 100);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            if (e.touches && e.touches[0]) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = e.touches[0].clientX - rect.left;
              setSliderPosition((x / rect.width) * 100);
            }
          }}
        >
          {/* After Image (Background) */}
          <img
            src={afterImg}
            alt="Custom Canvas After Paint Effect"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Before Image (Clipped Overlay) */}
          <img
            src={beforeImg}
            alt="Client Original Uploaded Photo"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
            }}
          />

          {/* Labels - Responsively scaled to avoid overlaps */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/65 text-white text-[8px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-md select-none tracking-wider uppercase">
            Before<span className="hidden min-[380px]:inline">: Original Photo</span>
          </div>
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-accent/90 text-white text-[8px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md select-none tracking-wider uppercase">
            After<span className="hidden min-[380px]:inline">: Hand-Painted</span><span className="hidden sm:inline"> Canvas</span>
          </div>

          {/* Drag Handle Divider */}
          <div
            className="absolute inset-y-0 z-10 w-0.5 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Central handle knob - Responsively scaled */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-secondary select-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 h-5 text-secondary animate-pulse"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                  className="rotate-90 origin-center"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion CTA */}
      {showCTA && (
        <div className="text-center mt-8 sm:mt-12">
          <Link
            to="/customize-canvas"
            className="inline-block bg-secondary hover:bg-secondary-dark text-white font-heading font-bold py-3 sm:py-4 px-4 min-[360px]:px-6 sm:px-10 rounded-full shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 uppercase tracking-wider sm:tracking-widest text-[10px] min-[360px]:text-xs sm:text-sm whitespace-nowrap"
          >
            Customize Your Canvas →
          </Link>
        </div>
      )}
    </div>
  );

  if (compact) {
    return <div className="w-full relative py-4 sm:py-6">{content}</div>;
  }

  return (
    <section className="section-padding section-spacing bg-white overflow-hidden relative">
      {content}
    </section>
  );
};

export default BeforeAfterSection;
