import { motion } from 'framer-motion';

/* ───────────────────────────────────────────────────────────────────────────
   The alternating image + story rows that make up the body of the School of
   Learning and Love frames (figma.com/design/hb5MRVdJB40DeurZ7KoKb5). Each row
   is an orange eyebrow, a 28px title and 18px copy beside a photo, and the
   photo swaps sides row by row, starting on the left.

   - rows       [{ eyebrow, title, paragraphs: [string], tagline?, image? }]
                `tagline` is the medium-weight line set between paragraphs
                one and two. `image` is optional: the frames are still in
                design and their photos are grey placeholders, so a row
                without one keeps a neutral block in the photo's place.
   - bodyClass  Paragraph colour; the two frames differ (#2f2f2f vs #333).
   - id         Anchor for the hero's call-to-action.
   ─────────────────────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const inView = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.15 },
  variants: fadeUp,
};

function Photo({ image, alt }) {
  if (image) {
    return <img src={image} alt={alt} loading="lazy" className="aspect-[562/330] w-full object-cover" />;
  }
  return <div aria-hidden className="aspect-[562/330] w-full bg-[#d9d9d9]" />;
}

export default function StoryRows({ rows, bodyClass = 'text-[#2f2f2f]', id }) {
  return (
    <section id={id} className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-16 sm:px-8 lg:px-0 lg:pt-[90px]">
      <div className="flex flex-col gap-16 lg:gap-[100px]">
        {rows.map((row, i) => {
          const photoFirst = i % 2 === 0;
          return (
            <motion.article
              key={row.title}
              {...inView}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-[94px]"
            >
              {/* On phones the photo always leads; from lg it alternates sides. */}
              <div className={photoFirst ? '' : 'lg:order-2'}>
                <Photo image={row.image} alt={row.imageAlt || ''} />
              </div>
              <div className={photoFirst ? '' : 'lg:order-1'}>
                <p className="text-[14px] font-medium uppercase tracking-[0.07em] text-accent sm:text-[16px]">
                  {row.eyebrow}
                </p>
                <h2 className="mt-3 text-[24px] font-semibold leading-[1.3] text-[#0c0c0c] sm:text-[28px] sm:leading-[38px]">
                  {row.title}
                </h2>
                <div className={`mt-4 space-y-4 text-[16px] leading-[1.6] sm:text-[18px] sm:leading-[28px] ${bodyClass}`}>
                  <p>{row.paragraphs[0]}</p>
                  {row.tagline && (
                    <p className="font-medium text-black">{row.tagline}</p>
                  )}
                  {row.paragraphs.slice(1).map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
