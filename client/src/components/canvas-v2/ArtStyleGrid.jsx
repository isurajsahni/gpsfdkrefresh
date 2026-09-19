import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shell, SectionHeading } from './Layout';
import { fadeUp, inView, stagger } from './motion';

import inkAndInterval from '../../assets/image/canvas-v2/styles/ink-and-interval.png';
import sassyClassic from '../../assets/image/canvas-v2/styles/sassy-classic.png';
import botanicalMuse from '../../assets/image/canvas-v2/styles/botanical-muse.png';
import tetheredHorizons from '../../assets/image/canvas-v2/styles/tethered-horizons.png';
import gazeOfPower from '../../assets/image/canvas-v2/styles/gaze-of-power.png';
import wildEccentrics from '../../assets/image/canvas-v2/styles/wild-eccentrics.png';
import modernLegend from '../../assets/image/canvas-v2/styles/modern-legend.png';
import nostalgiaNoir from '../../assets/image/canvas-v2/styles/nostalgia-noir.png';
import millionaireArt from '../../assets/image/canvas-v2/styles/millionaire-art.png';
import gildedBloom from '../../assets/image/canvas-v2/styles/gilded-bloom.png';
import velocitySuite from '../../assets/image/canvas-v2/styles/velocity-suite.png';
import afterHourSuite from '../../assets/image/canvas-v2/styles/after-hour-suite.png';
import celestialFrontier from '../../assets/image/canvas-v2/styles/celestial-frontier.png';
import etherealGaze from '../../assets/image/canvas-v2/styles/ethereal-gaze.png';

/* ── Find your art style ──────────────────────────────────────────────────────
   Two rows of 80px circles, 8 then 6, on a 160px pitch: at 1440 they sit at
   x = 124 + 160k, 4px inside the 1200 column (so the eighth ends 4px past it,
   as in the frame). Measured from the heading's line box top: row 1 circles at
   76.4, row 2 at 243.4 (167px pitch), each label's line box 11.5px under its
   circle. The section is 368.22px tall at 1440.

   Labels keep the frame's two lines and are wider than the circle, so each one
   is centred on it and overhangs both sides equally. */

/* Label lines as the frame breaks them. The frame spells it "Glided"; the
   catalogue collection is "Gilded". */
const STYLES = [
  { image: inkAndInterval, lines: ['Ink &', 'Interval'] },
  { image: sassyClassic, lines: ['The Sassy', 'Classic'] },
  { image: botanicalMuse, lines: ['The Botanical', 'Muse'] },
  // The frame turns this thumbnail -90°.
  { image: tetheredHorizons, lines: ['Tethered', 'Horizons'], rotated: true },
  { image: gazeOfPower, lines: ['The Gaze', 'Of Power'] },
  { image: wildEccentrics, lines: ['The Wild', 'Eccentrics'] },
  { image: modernLegend, lines: ['The Modern', 'Legend'] },
  { image: nostalgiaNoir, lines: ['Nostalgia', 'Noir'] },
  { image: millionaireArt, lines: ['The', 'Millionaire Art'] },
  { image: gildedBloom, lines: ['The Gilded', 'Bloom'] },
  { image: velocitySuite, lines: ['The Velocity', 'Suite'] },
  { image: afterHourSuite, lines: ['The After Hour', 'Suite'] },
  { image: celestialFrontier, lines: ['The Celestial', 'Frontier'] },
  { image: etherealGaze, lines: ['The Ethereal', 'Gaze'] },
];

export default function ArtStyleGrid() {
  return (
    <section className="px-5 sm:px-8">
      <Shell>
        <motion.div {...inView}>
          <SectionHeading>Find your art style</SectionHeading>
        </motion.div>

        {/* xl: eight fixed 80px tracks with 80px gaps, so rows 1 and 2 land on
            the frame's columns exactly (row 2 fills the first six). Below xl
            the circles centre in equal columns — 8 on laptops, 7 (two rows of
            seven) on tablets, 5 on large phones, 4 on phones and 3 under
            360px — which keeps the overhanging labels clear of each other. */}
        <motion.ul
          {...inView}
          variants={stagger(0.04)}
          className="mt-6 grid grid-cols-3 gap-y-6 min-[360px]:grid-cols-4 sm:mt-7 sm:grid-cols-5 sm:gap-y-8 md:grid-cols-7 lg:mt-[31.18px] lg:grid-cols-8 lg:gap-y-[42.18px] xl:grid-cols-[repeat(8,80px)] xl:gap-x-20 xl:pl-1"
        >
          {STYLES.map(({ image, lines, rotated }) => {
            const name = lines.join(' ');
            return (
              <motion.li key={name} variants={fadeUp}>
                <Link to="/store" className="group flex flex-col items-center focus-visible:outline-none">
                  {/* The PNGs are already round; the clip keeps the hover zoom
                      inside the circle (isolate stops Safari dropping the clip
                      mid-transition). */}
                  <span className="isolate block size-[68px] overflow-hidden rounded-full group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 sm:size-20">
                    <img
                      src={image}
                      alt={name}
                      width="80"
                      height="80"
                      loading="lazy"
                      className={`block size-full transition-transform duration-500 group-hover:scale-[1.06] ${rotated ? '-rotate-90' : ''}`}
                    />
                  </span>
                  {/* The image's alt already names the link, so the visible
                      label is hidden from screen readers to avoid reading the
                      name twice. */}
                  <span aria-hidden="true" className="mt-[11.5px] text-center text-[12px] font-normal leading-[1.19] text-black sm:text-[14px]">
                    {lines.map((line) => (
                      <span key={line} className="block whitespace-nowrap">
                        {line}
                      </span>
                    ))}
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </Shell>
    </section>
  );
}
