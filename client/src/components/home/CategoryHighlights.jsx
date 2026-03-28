import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import WebflowButton from '../ui/WebflowButton';
import poster1 from '../../assets/image/wallcanvas_poster_1.webp';
import poster2 from '../../assets/image/housenameplate_poster.webp';
import poster3 from '../../assets/image/wallcanvas_poster_2.webp';

const CategoryCard = ({ number, title, description, image, isReverse, link, bgColor, textColor = 'text-secondary', subTextColor = 'text-gray-600', isDark = false, zIndex }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Subtle scroll-linked animations for the card stacking
  const scale = useTransform(scrollYProgress, [0.4, 0.7], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0.4, 0.7], [1, 0.9]);

  return (
    <div ref={containerRef} className="h-screen w-full sticky top-10 flex items-center justify-center pointer-events-none" style={{ zIndex }}>
      <motion.div
        style={{ scale, opacity }}
        className={`w-full max-w-[1280px] h-[500px] md:h-[600px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto ${bgColor} flex flex-col md:flex-row`}
      >

        {/* Zigzag Layout Logic */}
        <div className={`w-full h-full flex flex-col md:flex-row ${isReverse ? 'md:flex-row-reverse' : ''}`}>

          {/* Image Side (50%) - Full Bleed inside the rounded box */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden">
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
            />
          </div>

          {/* Content Side (50%) */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full p-8 md:p-16 flex flex-col justify-center gap-6">
            <div className="space-y-4">
              <span className={`text-4xl md:text-5xl font-heading font-bold ${isDark ? 'text-white/20' : 'text-gray-200'}`}>
                {number}
              </span>
              <h3 className={`text-3xl md:text-5xl font-heading font-bold leading-tight ${textColor}`}>
                {title}
              </h3>
              <p className={`text-base md:text-lg leading-relaxed max-w-md ${isDark ? 'text-white/70' : subTextColor}`}>
                {description}
              </p>
            </div>

            <div className="pt-4">
              <WebflowButton to={link} dark={isDark}>
                Learn More
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
      bgColor: "bg-[#f8f5f0]", // Cream/Sand
      textColor: "text-secondary",
      subTextColor: "text-gray-600",
      isDark: false
    },
    {
      number: "02",
      title: "House Nameplates",
      description: "Define your entrance with absolute distinction. Handcrafted with premium materials that withstand the elements while making a bold statement of identity.",
      image: poster2,
      isReverse: true,
      link: "/category/house-nameplates",
      bgColor: "bg-[#2d4a3e]", // Deep Forest Green
      textColor: "text-white",
      subTextColor: "text-white/80",
      isDark: true
    },
    {
      number: "03",
      title: "Premium Collection",
      description: "Exclusively curated series for the discerning collector. Limited edition prints and oversized formats that redefine the boundaries of modern home decor.",
      image: poster3,
      isReverse: false,
      link: "/category/wall-canvas",
      bgColor: "bg-[#e5e5e5]", // Light Greyish
      textColor: "text-secondary",
      subTextColor: "text-gray-600",
      isDark: false
    }
  ];

  return (
    <section className="relative w-full py-24 bg-white">
      {/* Section Header */}
      <div className="max-w-[1280px] mx-auto px-6 mb-12 sm:mb-20 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-gray-500 uppercase tracking-[0.2em] font-medium text-sm mb-4 block"
        >
          Our Collections
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-heading font-bold text-secondary leading-tight"
        >
          Expert Decor for Every <span className="text-accent">House</span>
        </motion.h2>
        <div className="w-20 h-1.5 bg-accent mx-auto mt-6 rounded-full" />
      </div>

      {/* Scrollable stacking section */}
      <div className="relative px-6">
        {highlights.map((item, index) => (
          <CategoryCard key={item.number} {...item} zIndex={(index + 1) * 10} />
        ))}
      </div>
    </section>
  );
};

export default CategoryHighlights;
