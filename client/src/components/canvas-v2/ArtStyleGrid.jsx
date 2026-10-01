import { motion } from 'framer-motion';
import { Shell, SectionHeading } from './Layout';
import { fadeUp, inView, stagger } from './motion';
import StyleCircle from './StyleCircle';
import { ART_STYLES } from './artStyles';

/* ── Find your art style ──────────────────────────────────────────────────────
   Two rows of 80px circles, 8 then 7, on a 160px pitch: at 1440 they sit at
   x = 124 + 160k, 4px inside the 1200 column (so the eighth ends 4px past it,
   as in the frame). Measured from the heading's line box top: row 1 circles at
   76.4, row 2 at 243.4 (167px pitch), each label's line box 11.5px under its
   circle. The section is 368.22px tall at 1440. */

export default function ArtStyleGrid() {
  return (
    <section className="px-5 sm:px-8">
      <Shell>
        <motion.div {...inView}>
          <SectionHeading>Find your art style</SectionHeading>
        </motion.div>

        {/* xl: eight fixed 80px tracks with 80px gaps, so rows 1 and 2 land on
            the frame's columns exactly (row 2 fills the first seven). Below
            xl the circles centre in equal columns — 8 on laptops, 5 on tablets
            and large phones (three full rows of five), 4 on phones and 3 under
            360px — which keeps the overhanging labels clear of each other. */}
        <motion.ul
          {...inView}
          variants={stagger(0.04)}
          className="mt-6 grid grid-cols-3 gap-y-6 min-[360px]:grid-cols-4 sm:mt-7 sm:grid-cols-5 sm:gap-y-8 lg:mt-[31.18px] lg:grid-cols-8 lg:gap-y-[42.18px] xl:grid-cols-[repeat(8,80px)] xl:gap-x-20 xl:pl-1"
        >
          {ART_STYLES.map((style) => (
            <motion.li key={style.to} variants={fadeUp}>
              <StyleCircle {...style} />
            </motion.li>
          ))}
        </motion.ul>
      </Shell>
    </section>
  );
}
