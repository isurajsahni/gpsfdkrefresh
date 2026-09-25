import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { inView } from './motion';

import ctaBanner from '../../assets/image/canvas-v2/cta-banner.jpg';

/* ───────────────────────────────────────────────────────────────────────────
   Closing CTA banner.

   Figma: 1248×326 at x=96 — 24px wider than the 1200 content column on each
   side, so it takes its own max width instead of <Shell>. The artwork already
   carries the rounded orange panel with its white surround, the framed print
   and the foliage; only the copy is layered on top. The 2167×726 export is
   scaled to 1248 wide (418px tall) and lifted 47px, i.e. 47 / (418 − 326)
   = 51% down the overflow.

   Copy, from the banner's top edge (line boxes at leading 1.19):
     title     38px   box +92.614  (cap top +102)
     subtitle  14px   box +145.542 (cap top +149) → 7.708 under the title
     button    171×45 at +189                     → 26.798 under the subtitle
   That 141.386px block sits within 0.31px of the banner's centre, so it is
   flex-centred at every size and nudged down 0.614px at lg+ to land exactly
   on those numbers at 1440.

   The artwork's sparkle sits just left of the title (x 384–415 at 1248, the
   title starting at 439), so the title can only be as wide as the art is
   scaled. At the export's proportions it scales with the banner — 3.045cqw
   is 38px at 1248 — which keeps Figma's gap at every width from lg up.
   Below lg that would shrink it past legible, so phones and tablets use a
   fixed-height band instead: the art stays at a scale where the fixed-size
   title clears the sparkle.
   ─────────────────────────────────────────────────────────────────────────── */
export default function CtaBanner() {
  return (
    <section className="px-5 sm:px-8">
      <motion.div
        {...inView}
        className="relative mx-auto h-[240px] w-full max-w-[1248px] overflow-hidden rounded-[20px] [container-type:inline-size] md:h-[260px] lg:aspect-[1248/326] lg:h-auto lg:rounded-none"
      >
        {/* lg+: the export's own proportions, so the Figma crop holds at every
            width. Below lg: a fixed band (240px, 260px on tablets — tall
            enough that the art still covers the widest md banner), which crops
            the sides — and the artwork's rounded corners with them — so the
            box rounds itself, and the image is drawn 136% tall so the
            export's white surround falls outside the band. */}
        <img
          src={ctaBanner}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute left-0 top-1/2 h-[136%] w-full -translate-y-1/2 object-cover lg:top-0 lg:h-full lg:translate-y-0 lg:object-[center_51%]"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center lg:pt-[0.614px]">
          <h2 className="text-[24px] font-medium leading-[1.19] text-white md:text-[30px] lg:text-[length:min(38px,3.045cqw)]">
            Art that belongs to you
          </h2>
          <p className="mt-1.5 text-balance text-[13px] font-normal leading-[1.19] text-white md:text-[14px] lg:mt-[7.708px]">
            Find a canvas that feels like it was made for your space.
          </p>
          <Link
            to="/wall-canvas/all"
            className="mt-5 inline-flex h-10 w-[150px] items-center justify-center rounded-[40px] bg-white text-[13px] font-medium leading-[1.19] text-black shadow-[0px_4px_11.4px_0px_rgba(255,255,255,0.16)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-4 md:mt-5 md:w-[160px] md:text-[14px] lg:mt-[26.798px] lg:h-[45px] lg:w-[171px]"
          >
            Explore Collections
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
