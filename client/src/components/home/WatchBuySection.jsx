import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Bindal Niwas',
    video: 'https://cdn.pixabay.com/video/2021/04/04/69889-534571753_large.mp4',
    poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
    quote: 'When we bought our own house, we wanted a nameplate that was unique. GPS delivered beyond expectations — and it still looks superb after 18 months!',
  },
  {
    name: 'Harsh Bansal',
    video: 'https://cdn.pixabay.com/video/2020/07/30/45497-445918220_large.mp4',
    poster: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
    quote: 'They made an even better version of what I had seen in Chandigarh! Ready in just one day. Truly unique, durable, and premium.',
  },
  {
    name: 'Dhawan House',
    video: 'https://cdn.pixabay.com/video/2024/01/09/195392-901356498_large.mp4',
    poster: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',
    quote: 'Installed five years ago and it still looks extremely premium. I confidently recommend GPS to everyone — give your home the identity it deserves!',
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group"
            >
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-secondary-dark">
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
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 flex flex-col justify-end p-6">
                  <h3 className="text-white font-heading text-xl font-semibold">{item.name}</h3>
                  <p className="text-white/60 text-sm mt-2 line-clamp-3">{item.quote}</p>
                  <button className="mt-4 bg-accent hover:bg-accent-dark text-white py-2.5 px-6 rounded-full text-sm font-semibold w-fit transition-all duration-300 hover:scale-105">
                    Shop Similar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WatchBuySection;
