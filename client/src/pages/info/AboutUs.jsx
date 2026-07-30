import { motion } from 'framer-motion';
import aboutUsImage from '../../assets/image/about_us_demo.webp';
import SEO from '../../components/seo/SEO';
import { Eyebrow, KindCTA, KindHero, KindSectionHead } from '../../components/kindact/KindUI';
import heroImage from '../../assets/image/about_us_demo.webp';

const WHAT_WE_DO = [
  {
    title: 'Advertising & Marketing',
    items: ['Out-of-Home (DOH) Advertising', 'Social Media Management', 'Commercial Content Production'],
  },
  {
    title: 'Digital Solutions & Tech',
    items: ['Web Hosting & Development', 'Digital Media Creation'],
  },
  {
    title: 'Event Management',
    items: ['Corporate & Cultural Events', 'School of Creation - Innovation Hub'],
  },
  {
    title: 'Home & Lifestyle',
    items: ['Customised House Nameplates', 'Elegant Canvas Art'],
  },
];

const CORE_VALUES = [
  { title: 'Innovation', desc: "We prioritise our clients' needs and continuously adapt." },
  { title: 'Sustainability', desc: 'Ethical and sustainable business practices matter to us.' },
  { title: 'Community', desc: 'Nurturing collective advancement and growth for all.' },
  { title: 'Open Knowledge', desc: 'No holding patents, ensuring innovation is a communal asset.' },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="About GPSFDK | Premium Canvas Prints & House Nameplates India"
        description="GPSFDK crafts premium wall canvas prints and custom house nameplates in India. Discover our story, craftsmanship, and commitment to luxury home décor."
      />

      {/* ─── Hero ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          image={heroImage}
          crumb="Home / About GPS"
          title={
            <>
              We make luxury <span className="text-kind-lime">accessible to all.</span>
            </>
          }
          description="Discover our journey, mission, and the passion that drives us forward."
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {/* ─── Who we are ─── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center mt-10 sm:mt-14"
        >
          <div className="rounded-[24px] overflow-hidden">
            <img
              src={aboutUsImage}
              alt="About Us Creative Workspace"
              className="w-full h-64 sm:h-80 lg:h-[480px] object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>

          <div>
            <Eyebrow>Who we are</Eyebrow>
            <h2 className="apple-headline mt-3 font-heading text-kind-ink">
              Who We Are
            </h2>
            <div className="apple-body mt-5 space-y-4 text-kind-ink/70">
              <p>
                At Radhe Radhe GPS Private Limited, we are more than just a business group — we are a dynamic entity with a strong commitment to learning, innovation, and excellence. Unlike companies that focus on a single niche, we operate across multiple industries, offering diverse, high-quality solutions that blend creativity with affordability.
              </p>
              <p>
                Our mission is simple yet powerful: to make luxury accessible to all. We believe that premium services and products should not be limited to a select few but should be available to everyone.
              </p>
            </div>
            <div className="mt-6 bg-kind-mist rounded-[20px] p-6">
              <h3 className="apple-tile-title font-heading text-kind-ink">Our Journey</h3>
              <p className="apple-body mt-2 text-kind-ink/70">
                We started as an advertisement technology and signage startup, earning recognition from the DPIIT, Government of India. Over time, we expanded our expertise, and today, We proudly operate billboards and LED Videowall screens across North India.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── What we do ─── */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mt-14 sm:mt-20">
          <KindSectionHead
            eyebrow="What we do"
            title="What We Do"
            sub="Diverse, high-quality solutions across multiple industries — creative, digital and beyond."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {WHAT_WE_DO.map((card, i) => (
              <div
                key={card.title}
                className="bg-kind-mist rounded-[20px] p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300"
              >
                <span className="w-10 h-10 rounded-full bg-kind-forest text-kind-lime font-heading font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="apple-body font-heading font-semibold text-kind-ink">{card.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-kind-ink/70">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-kind-forest shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Core values + Vision ─── */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mt-14 sm:mt-20">
          <KindSectionHead
            eyebrow="Values & vision"
            title="Our Core Values"
            sub="The principles that shape everything we build."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {CORE_VALUES.map((value, i) => (
              <div
                key={value.title}
                className={`rounded-[20px] p-6 hover:-translate-y-1 transition-transform duration-300 ${
                  i % 2 === 0 ? 'bg-kind-lime text-kind-ink' : 'bg-kind-mint text-kind-ink'
                }`}
              >
                <h3 className="apple-body font-heading font-semibold">{value.title}</h3>
                <p className="apple-caption mt-2 text-kind-ink/70">{value.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Our Vision (forest panel) ─── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest text-white p-6 sm:p-10 lg:p-14 mt-10 sm:mt-14"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-kind-lime/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-kind-mint/10 blur-3xl" />
          </div>
          <div className="relative flex flex-col items-center text-center">
            <Eyebrow dark>Our vision</Eyebrow>
            <h2 className="apple-headline mt-3 font-heading">Our Vision</h2>
            <p className="apple-body mt-4 text-kind-sage max-w-2xl">
              We aim to bridge the divide between luxury and affordability, tradition and innovation, as well as creativity and practicality. Through advertising, digital media, home decor, and educational initiatives, our objective is to transform industries.
            </p>
            <p className="apple-intro mt-7 max-w-3xl font-heading text-white">
              "We don't just provide services; we create experiences, cultivate opportunities, and empower individuals and businesses to flourish."
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Closing CTA ─── */}
      <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
        <KindCTA />
      </motion.div>
    </div>
  );
};

export default AboutUs;
