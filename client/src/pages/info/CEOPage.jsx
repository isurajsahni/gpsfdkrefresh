import { motion } from 'framer-motion';
import { FaFacebook, FaInstagram, FaQuoteLeft } from 'react-icons/fa';

import fimpyGargImage from '../../assets/image/fimpygarg.webp';
import SEO from '../../components/seo/SEO';
import { Eyebrow, KindHero } from '../../components/kindact/KindUI';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const CEOPage = () => {
  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Meet the Founder | GPSFDK Premium Home Décor India"
        description="Meet the founder of GPSFDK and read the story behind India's premium custom canvas prints and house nameplate brand."
      />

      {/* ─── Hero ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          crumb="Home / CEO"
          title={
            <>
              A vision of growth, <span className="text-kind-lime">built to last.</span>
            </>
          }
          description="A vision of growth, opportunity, and building a legacy."
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 mt-10 sm:mt-14 items-start">
          {/* ─── Portrait card ─── */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="lg:col-span-5">
            <div className="bg-kind-mist rounded-[24px] p-4 sm:p-5">
              <div className="rounded-[20px] overflow-hidden">
                <img
                  src={fimpyGargImage}
                  alt="Fimpy Garg"
                  className="w-full aspect-square lg:aspect-[4/5] object-cover object-top hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="mt-5 px-1 pb-1 flex items-center justify-between gap-4">
                <div>
                  <h2 className="apple-tile-title font-heading text-kind-ink">Fimpy Garg</h2>
                  <p className="apple-body text-kind-forest font-semibold mt-0.5">CEO &amp; Founder</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <a
                    href="https://www.facebook.com/darsh.garg.39"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Fimpy Garg on Facebook"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center hover:bg-kind-ink hover:scale-105 transition-all duration-300"
                  >
                    <FaFacebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/fimpygarg"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Fimpy Garg on Instagram"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center hover:bg-kind-ink hover:scale-105 transition-all duration-300"
                  >
                    <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── Message ─── */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-7">
            <Eyebrow>CEO&apos;s message</Eyebrow>

            <div className="mt-5 border-l-4 border-kind-lime pl-5 sm:pl-7">
              <FaQuoteLeft className="text-kind-forest/20 text-2xl sm:text-3xl mb-3" />
              <p className="apple-intro font-heading text-kind-ink">
                "To be a soldier in a garden,
                <br />
                And a gardener in a war."
              </p>
            </div>

            <div className="apple-body mt-8 space-y-5 text-kind-ink/70">
              <p>
                Hello, I'm Fimpy Garg. I grew up in a business family and have known nothing but how a businessman can make it big! Not only by achieving his personal goals but by creating an aura of growth and opportunity all around, in ways one cannot even begin to comprehend.
              </p>
              <p className="font-medium text-kind-ink/90">
                GPS will be my life's work and I love being able to do it, be a part of it and you will love it even more!
              </p>
            </div>

            {/* ─── Get in Touch (forest panel) ─── */}
            <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest text-white p-6 sm:p-10 mt-8 sm:mt-10">
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-kind-lime/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-14 w-64 h-64 rounded-full bg-kind-mint/10 blur-3xl" />
              </div>
              <div className="relative">
                <Eyebrow dark>Get in touch</Eyebrow>
                <h3 className="apple-tile-title mt-3 font-heading">Get in Touch</h3>

                <div className="mt-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                    <span className="font-semibold text-kind-sage sm:min-w-[80px] text-xs uppercase tracking-[0.15em]">
                      Email
                    </span>
                    <a
                      href="mailto:fimpygarg2@gmail.com"
                      className="text-white/90 hover:text-kind-lime transition-colors text-base sm:text-lg break-all"
                    >
                      fimpygarg2@gmail.com
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                    <span className="font-semibold text-kind-sage sm:min-w-[80px] text-xs uppercase tracking-[0.15em]">
                      Mobile
                    </span>
                    <a
                      href="tel:+919646646063"
                      className="text-white/90 hover:text-kind-lime transition-colors text-base sm:text-lg"
                    >
                      +91 96466-46063
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 pt-4 border-t border-white/10">
                    <span className="font-semibold text-kind-sage sm:min-w-[80px] text-xs uppercase tracking-[0.15em] sm:mt-1">
                      Office
                    </span>
                    <span className="text-white/90 text-base sm:text-lg leading-snug">
                      GPS, Circular Road, Near More Store, Faridkot, Punjab 151203
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CEOPage;
