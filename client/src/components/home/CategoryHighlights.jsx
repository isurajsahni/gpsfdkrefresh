import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import WebflowButton from '../ui/WebflowButton';
import poster1 from '../../assets/image/wallcanvas_poster_1.webp';
import poster2 from '../../assets/image/housenameplate_poster.webp';
import poster3 from '../../assets/image/wallcanvas_poster_2.webp';

const CategoryCard = ({ number, title, description, image, isReverse, link, bgColor, isDark = false, zIndex }) => {
  const containerRef = useRef(null);
  
  // Refined scroll progress for the stacking-down effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Scale down and fade effect as the next card overlaps
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full sticky top-0 flex items-center justify-center pointer-events-none" 
      style={{ zIndex }}
    >
      <motion.div 
        // Universal scale/fade animation for both desktop and mobile
        style={{ scale, opacity }}
        className={`w-full max-w-[1280px] h-auto max-h-[85vh] md:max-h-none md:h-[600px] mx-auto rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto ${bgColor} flex flex-col md:flex-row`}
      >
        
        {/* Zigzag Structure */}
        <div className={`w-full h-full flex flex-col md:flex-row ${isReverse ? 'md:flex-row-reverse' : ''}`}>
          
          {/* Image Block: Slightly shorter on mobile to fit the sticky viewport */}
          <div className="w-full md:w-1/2 h-[290px] sm:h-[320px] md:h-full relative overflow-hidden">
            <img 
              src={image} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 md:group-hover:scale-110"
            />
          </div>

          {/* Text Content Block: Tighter padding on mobile to ensure button is visible while sticky */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-16 flex flex-col justify-center gap-3 md:gap-6 text-left overflow-y-auto md:overflow-visible">
            <div className="space-y-1 md:space-y-4">
              {/* Vibrant Orange Number */}
              <span className="text-4xl md:text-6xl font-heading font-bold text-accent block">
                {number}
              </span>
              <h3 className="text-xl md:text-5xl font-heading font-bold leading-tight text-secondary">
                {title}
              </h3>
              <p className="text-xs md:text-lg leading-relaxed max-w-md text-gray-600 line-clamp-3 md:line-clamp-none">
                {description}
              </p>
            </div>
            
            <div className="pt-2 md:pt-4">
              <WebflowButton to={link} dark={false} fullWidth={typeof window !== 'undefined' && window.innerWidth < 768}>
                Explore Now
              </WebflowButton>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

const CategoryHighlights = () => {
  const highlights = [
    {
      number: "01",
      title: "Wall Canvas Art",
      description: "Transform your walls into a gallery of expression. Our museum-grade canvases bring vibrant color and sophisticated texture to any interior environment.",
      image: poster1, 
      isReverse: false,
      link: "/category/wall-canvas",
      bgColor: "bg-primary",
      isDark: false
    },
    {
      number: "02",
      title: "House Nameplates",
      description: "Define your entrance with absolute distinction. Handcrafted with premium materials that withstand the elements while making a bold statement of identity.",
      image: poster2, 
      isReverse: true,
      link: "/category/house-nameplates",
      bgColor: "bg-primary",
      isDark: false
    },
    {
      number: "03",
      title: "Premium Collection",
      description: "Exclusively curated series for the discerning collector. Limited edition prints and oversized formats that redefine the boundaries of modern home decor.",
      image: poster3, 
      isReverse: false,
      link: "/category/wall-canvas",
      bgColor: "bg-primary",
      isDark: false
    }
  ];

  return (
    <section className="relative w-full py-16 md:py-24 bg-white transition-colors duration-500">
      {/* Section Header */}
      <div className="max-w-[1280px] mx-auto mb-8 md:mb-20 text-center">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-gray-500 uppercase tracking-[0.2em] font-medium text-xs md:text-sm mb-2 md:mb-4 block"
        >
          Our Collections
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-heading font-bold text-secondary leading-tight"
        >
          Expert Decor for Every <span className="text-accent">House</span>
        </motion.h2>
        <div className="w-16 md:w-20 h-1.5 bg-accent mx-auto mt-4 md:mt-6 rounded-full shadow-lg" />
      </div>

      {/* Primary Scroll Container (Sticky enabled globally) */}
      <div className="relative px-4 md:px-6 pb-8">
        {highlights.map((item, index) => (
          <CategoryCard key={item.number} {...item} zIndex={(index + 1) * 10} />
        ))}
      </div>
    </section>
  );
};

export default CategoryHighlights;
