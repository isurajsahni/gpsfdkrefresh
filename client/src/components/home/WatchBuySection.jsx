import { motion } from 'framer-motion';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import housenameplate1 from '../../assets/videos/housenameplate1.mp4';
import jokercanvas from '../../assets/videos/jokercanvas.mp4';
import pinklotus from '../../assets/videos/pinklotus.mp4';
import wolfofwallstreet from '../../assets/videos/wolfofwallstreetcanvas.mp4';

const watchBuyItems = [
  {
    name: 'House Nameplate',
    price: 2499,
    video: housenameplate1,
  },
  {
    name: 'Joker Canvas',
    price: 3199,
    video: jokercanvas,
  },
  {
    name: 'Pink Lotus',
    price: 2899,
    video: pinklotus,
  },
  {
    name: 'Wolf of Wall Street Canvas',
    price: 3499,
    video: wolfofwallstreet,
  },
];

const WatchBuySection = () => {
  return (
    <section className="section-padding section-spacing bg-secondary">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mt-3">Watch & Buy</h2>
          <p className="text-white/50 mt-3 max-w-lg mx-auto">Real stories from our happy customers</p>
          <div className="w-20 h-1 bg-accent mt-4 rounded-full mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {watchBuyItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col"
            >
              {/* Video Container — reduced height */}
              <div className="relative rounded-t-2xl overflow-hidden bg-secondary-dark" style={{ height: 'clamp(200px, 45vw, 350px)' }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={item.video} type="video/mp4" />
                </video>
              </div>

              {/* Content Below Video */}
              <div className="bg-[#1a3a2e] rounded-b-2xl px-4 py-4 flex flex-col gap-2">
                <h3 className="text-white font-heading text-base md:text-lg font-semibold truncate">{item.name}</h3>
                <p className="text-accent font-bold text-lg md:text-xl">₹{item.price.toLocaleString()}</p>
                <button className="mt-1 w-full bg-accent hover:bg-accent-dark text-white py-2.5 px-4 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
                  <HiOutlineShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WatchBuySection;
