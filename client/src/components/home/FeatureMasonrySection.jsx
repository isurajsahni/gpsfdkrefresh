import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FeatureCard = ({ badge, title, description, image, isLarge }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={`group relative overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-2xl ${
      isLarge ? 'h-[520px]' : 'h-[250px]'
    }`}
  >
    {/* Background Image */}
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={image}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-colors duration-500 group-hover:bg-black/40" />
    </div>

    {/* Content */}
    <div className="relative h-full w-full p-8 flex flex-col justify-end">
      <div>
        <span className="inline-block bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-4 border border-white/20">
          {badge}
        </span>
        <h3 className={`font-heading font-bold text-white transition-transform duration-500 ${
          isLarge ? 'text-4xl md:text-5xl lg:text-6xl mb-4' : 'text-2xl md:text-3xl mb-2'
        }`}>
          {title}
        </h3>
        <p className={`text-white/80 max-w-md transition-opacity duration-500 ${
          isLarge ? 'text-base md:text-lg mb-6 line-clamp-3' : 'text-sm mb-4 line-clamp-2'
        }`}>
          {description}
        </p>
      </div>

      <Link 
        to="/shop" 
        className="flex items-center text-white font-bold tracking-wider hover:text-accent transition-colors group/link"
      >
        <span className="relative overflow-hidden inline-block">
          View all
          <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white translate-x-[-101%] group-hover/link:translate-x-0 transition-transform duration-500" />
        </span>
        <motion.span 
          className="ml-2 text-2xl font-light"
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          →
        </motion.span>
      </Link>
    </div>
  </motion.div>
);

const FeatureMasonrySection = () => {
  const features = [
    {
      badge: "EV",
      title: "Electrify Your Dreams",
      description: "Discover the future where cutting-edge design meets electric performance and style. Experience a new era of automotive excellence.",
      image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80",
      isLarge: true
    },
    {
      badge: "REDWING",
      title: "Explore With Every Ride",
      description: "Crafted for those who dare to explore. Every detail is engineered for precision and durability on any terrain.",
      image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80",
      isLarge: false
    },
    {
      badge: "BIGWING",
      title: "Excites the World",
      description: "Unleash the power of innovation. A perfect blend of speed, safety, and sophisticated aesthetics for the bold.",
      image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
      isLarge: false
    }
  ];

  return (
    <section className="py-20 px-4 md:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Left Column: Large Card */}
          <div className="col-span-1 h-full">
            <FeatureCard {...features[0]} />
          </div>

          {/* Right Column: Two Stacked Cards */}
          <div className="col-span-1 flex flex-col gap-6 justify-between h-full">
            <FeatureCard {...features[1]} />
            <FeatureCard {...features[2]} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeatureMasonrySection;
