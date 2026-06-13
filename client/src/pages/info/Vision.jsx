import { motion } from 'framer-motion';
import {
  HiOutlineLightBulb,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
} from 'react-icons/hi';
import { FaQuoteLeft } from 'react-icons/fa';
import SEO from '../../components/seo/SEO';
import WebflowButton from '../../components/ui/WebflowButton';

const coreValues = [
  {
    Icon: HiOutlineLightBulb,
    title: 'Innovation',
    desc: "We prioritise our clients' needs and continuously adapt.",
  },
  {
    Icon: HiOutlineGlobeAlt,
    title: 'Sustainability',
    desc: 'Ethical and sustainable business practices matter to us.',
  },
  {
    Icon: HiOutlineUserGroup,
    title: 'Community',
    desc: 'Nurturing collective advancement and growth for all.',
  },
  {
    Icon: HiOutlineBookOpen,
    title: 'Open Knowledge',
    desc: 'No holding patents, ensuring innovation is a communal asset.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const Vision = () => {
  return (
    <div className="relative min-h-screen bg-primary pt-[100px] sm:pt-[120px] pb-16 sm:pb-24 text-secondary overflow-hidden">
      <SEO
        title="Our Vision & Core Values | GPSFDK"
        description="The vision and core values behind GPS — innovation, sustainability, community, and open knowledge. Bridging luxury and affordability, tradition and innovation."
      />

      {/* Decorative background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 sm:w-[32rem] sm:h-[32rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 sm:w-[32rem] sm:h-[32rem] rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20 md:mb-24"
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-4">
            What drives us forward
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold text-secondary mb-5 sm:mb-6 tracking-wide leading-tight">
            Our Vision
          </h1>
          <div className="w-24 sm:w-32 h-1 sm:h-1.5 bg-accent mx-auto rounded-full shadow-lg shadow-accent/20" />
          <p className="mt-6 sm:mt-7 text-base sm:text-lg md:text-xl text-secondary/70 font-body max-w-2xl mx-auto">
            Bridging luxury and affordability, tradition and innovation — and turning
            creativity into something everyone can hold.
          </p>
        </motion.div>

        {/* ── Core Values ── */}
        <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-secondary mb-3 sm:mb-4">
            Our Core Values
          </h2>
          <div className="w-12 sm:w-16 h-1 bg-accent mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-20 sm:mb-24 md:mb-28">
          {coreValues.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-primary/60 backdrop-blur-sm p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-secondary/10 hover:border-accent/40 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <value.Icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-bold text-secondary mb-2">
                {value.title}
              </h3>
              <p className="text-sm sm:text-base text-secondary/70 leading-relaxed">
                {value.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Vision statement ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center mb-20 sm:mb-24"
        >
          <div className="lg:col-span-5">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-accent leading-tight">
              Transforming industries, one experience at a time
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-base sm:text-lg md:text-xl text-secondary/80 leading-relaxed">
              We aim to bridge the divide between luxury and affordability, tradition and
              innovation, as well as creativity and practicality. Through advertising, digital
              media, home decor, and educational initiatives, our objective is to transform
              industries.
            </p>
          </div>
        </motion.div>

        {/* ── Pull quote ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-secondary text-primary p-8 sm:p-12 md:p-16 text-center shadow-2xl"
        >
          <div aria-hidden className="absolute -top-10 -right-6 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
          <FaQuoteLeft className="mx-auto text-3xl sm:text-4xl text-accent mb-6 sm:mb-8" />
          <p className="relative z-10 max-w-3xl mx-auto text-xl sm:text-2xl md:text-3xl font-heading font-medium leading-relaxed">
            We don't just provide services; we create experiences, cultivate opportunities, and
            empower individuals and businesses to flourish.
          </p>
        </motion.div>

        {/* ── Closing CTA ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mt-16 sm:mt-20 flex flex-col items-center text-center"
        >
          <p className="text-base sm:text-lg text-secondary/70 mb-6 max-w-xl">
            See the vision in action — explore our handcrafted canvas collection.
          </p>
          <WebflowButton to="/wall-canvas">Explore Our Canvas Collection</WebflowButton>
        </motion.div>

      </div>
    </div>
  );
};

export default Vision;
