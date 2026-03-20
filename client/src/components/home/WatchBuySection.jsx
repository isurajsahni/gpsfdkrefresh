import { motion } from 'framer-motion';
import { HiOutlineShoppingCart } from 'react-icons/hi';

const watchBuyItems = [
  {
    name: 'Bindal Niwas',
    price: 2499,
    video: 'https://cdn.pixabay.com/video/2021/04/04/69889-534571753_large.mp4',
    poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
  },
  {
    name: 'Harsh Bansal',
    price: 3199,
    video: 'https://cdn.pixabay.com/video/2020/07/30/45497-445918220_large.mp4',
    poster: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
  },
  {
    name: 'Dhawan House',
    price: 2899,
    video: 'https://cdn.pixabay.com/video/2024/01/09/195392-901356498_large.mp4',
    poster: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',
  },
  {
    name: 'Modern Villa',
    price: 3499,
    video: 'https://cdn.pixabay.com/video/2021/04/04/69889-534571753_large.mp4',
    poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
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
          <span className="text-accent font-body text-sm tracking-[0.3em] uppercase">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mt-3">Watch & Buy</h2>
          <p className="text-white/50 mt-3 max-w-lg mx-auto">Real stories from our happy customers</p>
          <div className="w-20 h-1 bg-accent mt-4 rounded-full mx-auto" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                  poster={item.poster}
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
