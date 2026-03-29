import { motion } from 'framer-motion';
import WebflowButton from '../ui/WebflowButton';
import housenameplate1 from '../../assets/videos/housenameplate1.mp4';
import jokercanvas from '../../assets/videos/jokercanvas.mp4';
import pinklotus from '../../assets/videos/pinklotus.mp4';
import wolfofwallstreet from '../../assets/videos/wolfofwallstreetcanvas.mp4';

const watchBuyItems = [
  {
    name: 'House Nameplate',
    video: housenameplate1,
  },
  {
    name: 'Joker Canvas',
    video: jokercanvas,
  },
  {
    name: 'Pink Lotus',
    video: pinklotus,
  },
  {
    name: 'Wolf of Wall Street Canvas',
    video: wolfofwallstreet,
  },
];

const WatchBuySection = () => {
  return (
    <section className="section-padding section-spacing bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">Watch & Buy</h2>
            <div className="w-20 h-1.5 bg-accent mt-6 rounded-full" />
          </div>
          
          <div className="hidden md:block">
            <WebflowButton to="/wall-canvas">
              View All Products
            </WebflowButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {watchBuyItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`flex flex-col group ${i >= 2 ? 'hidden sm:flex' : ''}`}
            >
              {/* Video Container */}
              <div className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-secondary-dark shadow-xl">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                >
                  <source src={item.video} type="video/mp4" />
                </video>
                
                {/* Visual Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 group-hover:opacity-40 transition-opacity duration-500" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h3 className="text-white font-heading text-lg md:text-xl font-bold tracking-tight mb-2">
                    {item.name}
                  </h3>
                  <div className="w-10 h-1 bg-accent rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-[2.5]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile-only CTA */}
        <div className="mt-16 flex justify-center md:hidden">
          <WebflowButton to="/wall-canvas" fullWidth>
            View All Products
          </WebflowButton>
        </div>
      </div>
    </section>
  );
};

export default WatchBuySection;
