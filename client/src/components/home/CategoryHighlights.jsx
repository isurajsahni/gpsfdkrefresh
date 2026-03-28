import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import poster1 from '../../assets/image/wallcanvas_poster_1.webp';
import poster2 from '../../assets/image/housenameplate_poster.webp';
import poster3 from '../../assets/image/wallcanvas_poster_2.webp';

const CategoryCard = ({ number, title, description, image, isReverse, link }) => {
  return (
    <div className="sticky top-0 h-screen flex items-center justify-center py-20 bg-primary">
      <div className={`max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center gap-12 ${isReverse ? 'md:flex-row-reverse' : ''}`}>
        
        {/* Image side */}
        <motion.div 
          initial={{ opacity: 0, x: isReverse ? 50 : -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="w-full md:w-1/2"
        >
          <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl group">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
          </div>
        </motion.div>

        {/* Text side */}
        <motion.div 
          initial={{ opacity: 0, x: isReverse ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 space-y-6"
        >
          <span className="text-4xl md:text-6xl font-heading font-bold text-gray-200 block">
            {number}
          </span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-secondary leading-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-lg">
            {description}
          </p>
          <Link 
            to={link} 
            className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-full font-bold hover:bg-accent transition-all duration-300 group shadow-lg"
          >
            Explore Collection
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

const CategoryHighlights = () => {
  const containerRef = useRef(null);
  
  const highlights = [
    {
      number: "01",
      title: "Wall Canvas Art",
      description: "Elevate your living space with our premium wall canvases. From modern abstract to timeless classics, find the perfect piece that defines your style.",
      image: poster1,
      isReverse: false,
      link: "/category/wall-canvas"
    },
    {
      number: "02",
      title: "House Nameplates",
      description: "Make a lasting first impression. Our custom nameplates are handcrafted using durable materials and elegant typography to welcome you home in style.",
      image: poster2,
      isReverse: true,
      link: "/category/house-nameplates"
    },
    {
      number: "03",
      title: "The Collector's Suite",
      description: "Curated wall canvas sets designed to create a focal point in any room. Expertly printed and framed with high-grade gallery quality precision.",
      image: poster3,
      isReverse: false,
      link: "/category/wall-canvas"
    }
  ];

  return (
    <section ref={containerRef} className="relative bg-primary overflow-hidden">
      {/* Scrollable stacking section */}
      <div className="relative">
        {highlights.map((item, idx) => (
          <CategoryCard key={item.number} {...item} />
        ))}
      </div>
    </section>
  );
};

export default CategoryHighlights;
