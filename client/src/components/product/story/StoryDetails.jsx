import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuArrowUpRight } from 'react-icons/lu';
import { collectionPath } from '../../../utils/collections';
import StoryIcon from './StoryIcon';

/* ── Every detail ─────────────────────────────────────────────────────────────
   The spec sheet (set like a tech-specs table, with its heading pinned beside
   it on desktop), what's in the box, care, and the delivery and returns
   promises, each linking to its policy page. */

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

function CardList({ title, items }) {
  return (
    <motion.div {...reveal} className="mt-14">
      <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{title}</h3>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="rounded-3xl bg-[#f7f5f0] p-5">
            <span className="grid size-11 place-items-center rounded-full bg-white text-secondary shadow-[0_6px_16px_-10px_rgba(0,0,0,0.4)]">
              <StoryIcon name={item.icon} className="size-[22px]" />
            </span>
            <p className="mt-4 text-[16px] font-semibold text-[#1d1d1f]">{item.title}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[#6e6e73]">{item.text}</p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function StoryDetails({ specs, collection, box, care, promises }) {
  return (
    <section aria-labelledby="details-title" className="bg-white px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <motion.div {...reveal} className="lg:sticky lg:top-28">
              <p className="apple-eyebrow uppercase text-accent">The details</p>
              <h2 id="details-title" className="apple-headline mt-3 font-heading">
                <span className="text-[#1d1d1f]">Every detail.</span>{' '}
                <span className="text-[#86868b]">Nothing left to guess.</span>
              </h2>
              <p className="apple-body mt-4 max-w-[36ch] text-[#6e6e73]">What it’s made of, what arrives and how to look after it.</p>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <motion.dl {...reveal} className="border-t border-black/10">
              {specs.map(([term, detail]) => (
                <div key={term} className="grid gap-1 border-b border-black/10 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
                  <dt className="text-[14px] font-medium text-[#6e6e73]">{term}</dt>
                  <dd className="text-[16px] leading-relaxed text-[#1d1d1f]">
                    {term === 'Collection' && collection ? (
                      <Link to={collectionPath(collection)} className="group inline-flex items-center gap-1 font-medium text-secondary hover:text-accent">
                        {detail}
                        <LuArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </Link>
                    ) : (
                      detail
                    )}
                  </dd>
                </div>
              ))}
            </motion.dl>

            {box && <CardList title="In the box" items={box} />}
            <CardList title="Care" items={care} />
          </div>
        </div>

        <motion.ul {...reveal} className="mt-20 grid gap-px overflow-hidden rounded-3xl bg-black/10 ring-1 ring-black/10 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((promise) => (
            <li key={promise.title} className="bg-[#fbfaf7]">
              <Link
                to={promise.to}
                className="group flex h-full flex-col p-6 transition-colors hover:bg-white focus-visible:bg-white focus-visible:outline-none"
              >
                <span className="text-secondary">
                  <StoryIcon name={promise.icon} className="size-6" />
                </span>
                <span className="mt-4 text-[16px] font-semibold text-[#1d1d1f]">{promise.title}</span>
                <span className="mt-1 flex-1 text-[14px] leading-relaxed text-[#6e6e73]">{promise.text}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent">
                  Read the policy
                  <LuArrowUpRight aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
