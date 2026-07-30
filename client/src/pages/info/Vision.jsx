import { motion } from 'framer-motion';
import {
  HiOutlineLightBulb,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
} from 'react-icons/hi';
import { FaQuoteLeft } from 'react-icons/fa';
import SEO from '../../components/seo/SEO';
import { KindCTA, KindHero, KindSectionHead } from '../../components/kindact/KindUI';
import heroImage from '../../assets/image/wallcanvas_poster_2.webp';

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
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Our Vision & Core Values | GPSFDK"
        description="The vision and core values behind GPS — innovation, sustainability, community, and open knowledge. Bridging luxury and affordability, tradition and innovation."
      />

      {/* ─── Hero ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          image={heroImage}
          crumb="Home / Vision"
          title={
            <>
              Creating impact <span className="text-kind-lime">that never fades.</span>
            </>
          }
          description="Bridging luxury and affordability, tradition and innovation — and turning creativity into something everyone can hold."
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {/* ─── Our Direction ─── */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mt-14 sm:mt-20">
          <KindSectionHead
            eyebrow="Our direction"
            title="What drives us forward"
            sub="Our purpose, clearly defined — the mission we build towards and the promise we make."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {/* Mission — lime card */}
            <div className="bg-kind-lime text-kind-ink rounded-[20px] p-6 sm:p-10 flex flex-col justify-center">
              <h2 className="apple-headline font-heading">
                Transforming industries, one experience at a time
              </h2>
              <p className="apple-body mt-4 text-kind-ink/70">
                We aim to bridge the divide between luxury and affordability, tradition and
                innovation, as well as creativity and practicality. Through advertising, digital
                media, home decor, and educational initiatives, our objective is to transform
                industries.
              </p>
            </div>

            {/* Pull quote — mint card */}
            <div className="bg-kind-mint text-kind-ink rounded-[20px] p-6 sm:p-10 flex flex-col justify-center">
              <FaQuoteLeft className="text-kind-forest text-2xl sm:text-3xl mb-4 sm:mb-5" />
              <p className="apple-intro font-heading">
                We don't just provide services; we create experiences, cultivate opportunities, and
                empower individuals and businesses to flourish.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Core Values ─── */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mt-14 sm:mt-20">
          <KindSectionHead
            eyebrow="Core values"
            title="Our Core Values"
            sub="The principles that shape how we work, build and grow."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {coreValues.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-kind-mist rounded-[20px] p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300"
              >
                <span className="w-11 h-11 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center">
                  <value.Icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="apple-body font-heading font-semibold text-kind-ink">{value.title}</h3>
                  <p className="apple-caption mt-2 text-kind-ink/60">{value.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Closing CTA ─── */}
      <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
        <KindCTA
          eyebrow="Take action"
          title="See the vision in action"
          text="See the vision in action — explore our handcrafted canvas collection."
          to="/wall-canvas"
          cta="Explore Our Canvas Collection"
        />
      </motion.div>
    </div>
  );
};

export default Vision;
