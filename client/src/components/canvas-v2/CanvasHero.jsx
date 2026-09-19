import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Lines from '../landing/Lines';
import { Shell } from './Layout';
import { fadeUp } from './motion';

import heroWallArt from '../../assets/image/canvas-v2/hero-wall-art.jpg';
import brushUnderline from '../../assets/image/canvas-v2/icons/brush-underline.svg';

/* ── Hero ─────────────────────────────────────────────────────────────────────
   Full-bleed 394px band (Figma image node at y=50, 1440x394). The copy sits on
   the empty wall at the left of the photo: its column starts at x=158, which is
   38px inside the 1200 content column.

   Every vertical step below is measured from the band's top at 1440, with each
   text line box starting 0.247em above the Figma cap-top y:
     eyebrow line 67 · headline line 92.6 · underline 197 · paragraph line 236
     · button 295–340 · band bottom 394.
   Line boxes are 1.19em (SF Pro's ascent + descent), so the margins between
   them come out fractional; together they add up to exactly 394. */

/* Phones only: the copy has to sit on top of the art, so the wall is lifted
   from the top down. The frame has no wash, so none is drawn from sm up. */
const PHONE_WASH =
  'linear-gradient(180deg, rgba(250,246,240,0.96) 0%, rgba(250,246,240,0.92) 48%, rgba(250,246,240,0.55) 100%)';

export default function CanvasHero() {
  return (
    <section className="relative isolate overflow-hidden px-5 sm:px-8">
      {/* 2103x748 photo scaled to the band width: at 1440 it is 512px tall and
          the frame crops 21.95px off the top, i.e. 18.57% of the 118px
          overflow. Below ~1108px the band's height drives the scale instead
          and the photo crops sideways; tablets then shift it 20% from the left
          so the copy stays on the wall rather than over the first canvas.
          Phones keep it centred under the wash. */}
      <img
        src={heroWallArt}
        alt=""
        aria-hidden="true"
        width="2103"
        height="748"
        fetchPriority="high"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_18.57%] sm:object-[20%_18.57%]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 sm:hidden" style={{ backgroundImage: PHONE_WASH }} />

      <Shell className="min-h-[500px] pb-14 pt-14 sm:min-h-[394px] sm:pb-[54px] sm:pt-[67px] lg:pl-[38px]">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          {/* The frame's copy has two spaces between words, kept by
              whitespace-pre. The 45x2 rule follows 5px after the text, its top
              4px below the cap top (cap top = line top + 2.96). */}
          <p className="flex items-start text-[12px] font-normal uppercase leading-[1.19] tracking-[1.8px] text-[#404040]">
            <span className="whitespace-pre">{'Art  for  a  brighter  everyday'}</span>
            <span aria-hidden="true" className="ml-[5px] mt-[7px] h-[2px] w-[45px] shrink-0 bg-accent" />
          </p>

          <h1 className="mt-[11.32px] max-w-[389px] text-[32px] font-medium leading-[1.19] text-[#353535] sm:text-[34px] lg:text-[42px]">
            <span className="block">Art that makes your</span>
            <span className="block">space yours</span>
          </h1>

          {/* 104.4px below the headline's top: 4.44px under its two 49.98px
              lines. Left edge on the copy column, native 219x10. */}
          <img src={brushUnderline} alt="" aria-hidden="true" className="mt-[4.44px] block" />

          {/* sm to xl the photo is cropped by height, which pulls the potted
              plant in under the copy (its leaves start ~0.2 × width + 194px
              from the left, or 0.375 × width once the photo scales by width).
              These caps wrap the paragraph just short of it; from xl it
              takes the frame's 389px and breaks where Figma does. */}
          <p className="mt-[29px] max-w-[389px] text-[16px] font-normal leading-[1.19] text-[#404040] sm:max-w-[280px] md:max-w-[310px] lg:max-w-[330px] xl:max-w-[389px]">
            <Lines lines={['Discover art crafted to transform everyday spaces', 'into something extraordinary.']} />
          </p>

          {/* The frame sets the button 3px left of the copy (x=155 vs 158). */}
          <Link
            to="/store"
            className="-ml-[3px] mt-[20.92px] flex h-[45px] w-[171px] items-center justify-center rounded-[40px] bg-accent text-[14px] font-medium text-white shadow-[0px_4px_11.4px_0px_rgba(255,255,255,0.16)] transition-colors duration-300 hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Explore Collections
          </Link>
        </motion.div>
      </Shell>
    </section>
  );
}
