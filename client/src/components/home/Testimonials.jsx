import { motion } from 'framer-motion';
import { HiStar } from 'react-icons/hi';

const row1 = [
  {
    name: 'Aarav Mehta',
    initial: 'A',
    rating: '5.0',
    bgClass: 'bg-secondary',
    text: "The canvas quality is absolutely stunning! The colors are so vibrant and it matches my living room perfectly. Delivery was super fast across Delhi."
  },
  {
    name: 'Nicole Kosoff',
    initial: 'N',
    rating: '5.0',
    bgClass: 'bg-[#5D4037]', // Elegant warm brown
    text: "Outstanding printing quality. The canvas material is premium, and the details are very sharp. Packaging was very secure and arrived without any damage."
  },
  {
    name: 'Kathryn Barron',
    initial: 'K',
    rating: '5.0',
    bgClass: 'bg-accent', // Brand Orange Accent
    text: "I ordered some canvas panels for my office lobby, and they have transformed the space completely. Everyone who walks in compliments them! Outstanding!"
  },
  {
    name: 'Brittney Rodriguez',
    initial: 'B',
    rating: '5.0',
    bgClass: 'bg-[#8D6E63]', // Elegant muted brown
    text: "I've now ordered from GPSFDK twice and will continue to have them as my first choice. Their custom nameplates are exceptionally high quality and elegant."
  }
];

const row2 = [
  {
    name: 'Rajesh Sharma',
    initial: 'R',
    rating: '5.0',
    bgClass: 'bg-indigo-700',
    text: "Ordered a custom acrylic nameplate for our new house. The design process was seamless, and the final product is so elegant. Best place in India for nameplates."
  },
  {
    name: 'Jeff Boone',
    initial: 'J',
    rating: '5.0',
    bgClass: 'bg-[#D81B60]', // Premium ruby pink
    text: "Best place in India for custom wall prints. The wooden framing is highly durable and looks extremely premium. Highly recommended for home decor!"
  },
  {
    name: 'Katherine Soares',
    initial: 'K',
    rating: '5.0',
    bgClass: 'bg-accent', // Brand Orange Accent
    text: "We used GPSFDK for custom gifting canvases at our corporate retreat. They delivered right on time, and every single print was flawless. Highly recommend!"
  },
  {
    name: 'Jennifer Weeks',
    initial: 'J',
    rating: '5.0',
    bgClass: 'bg-secondary', // Brand Forest Green Secondary
    text: "They did an incredible job customizing the size and font for our family nameplate. It looks beautiful under the outdoor lighting. Worth every rupee!"
  }
];

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

const TestimonialCard = ({ item }) => (
  <div className="w-[320px] sm:w-[380px] md:w-[420px] flex-shrink-0 bg-white/95 border border-cream-dark shadow-sm hover:shadow-md transition-all duration-300 p-6 md:p-8 rounded-2xl mx-3 flex flex-col justify-between whitespace-normal">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {/* Circular Initial Avatar with shadow */}
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl mr-4 flex-shrink-0 shadow-inner ${item.bgClass}`}>
            {item.initial}
          </div>
          
          {/* User Details */}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 text-sm sm:text-base font-body">{item.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <HiStar className="text-amber-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-600">{item.rating}</span>
            </div>
          </div>
        </div>
        
        {/* Google Brand G Logo - Stroke SVG icon */}
        <GoogleIcon />
      </div>
      
      {/* Review Text */}
      <p className="italic text-gray-600 font-body text-xs sm:text-sm md:text-base leading-relaxed mt-2">
        "{item.text}"
      </p>
    </div>
  </div>
);

const Testimonials = () => {
  return (
    <section id="testimonials" className="section-padding section-spacing bg-primary overflow-hidden relative">
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-10 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="text-accent font-body text-sm tracking-[0.3em] uppercase">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-secondary mt-3">What Our Customers Say</h2>
          <div className="w-20 h-1 bg-accent mt-[15px] rounded-full mx-auto" />
        </motion.div>
      </div>

      {/* Marquee Rows Container */}
      <div className="flex flex-col gap-6 w-full relative z-10">
        
        {/* Row 1: Moves Left */}
        <div className="flex overflow-hidden py-2 w-full select-none [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap min-w-full">
            {row1.map((item, index) => (
              <TestimonialCard key={`r1-${index}`} item={item} />
            ))}
            {row1.map((item, index) => (
              <TestimonialCard key={`r1-dup-${index}`} item={item} />
            ))}
          </div>
        </div>

        {/* Row 2: Moves Right */}
        <div className="flex overflow-hidden py-2 w-full select-none [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="flex animate-marquee-reverse hover:[animation-play-state:paused] whitespace-nowrap min-w-full">
            {row2.map((item, index) => (
              <TestimonialCard key={`r2-${index}`} item={item} />
            ))}
            {row2.map((item, index) => (
              <TestimonialCard key={`r2-dup-${index}`} item={item} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
