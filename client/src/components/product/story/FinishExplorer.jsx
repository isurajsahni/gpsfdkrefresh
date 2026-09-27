import { AnimatePresence, motion } from 'framer-motion';
import { LuCheck, LuRotate3D, LuRotateCw } from 'react-icons/lu';
import FinishMockup from './FinishMockup';
import { NUMBER_WORDS } from './storyData';
import useTurntable from './useTurntable';

/* ── Choose your finish ───────────────────────────────────────────────────────
   Straight under the buy box: every finish the product comes in, each as a 3D
   model of its own artwork on a stage, which can be dragged round to see its
   edges and back. Picking one here picks it in the buy box too (the same
   variation lookup the buy box's buttons use), so what's on the stage is
   always what goes in the cart. It sits on the buy box's grid rather than the
   story's 1200px column, since it follows straight on from it. */

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' };

// Small line drawings of each finish for the picker
function FinishGlyph({ kind }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
      {kind === 'stretched' && (
        <>
          <path d="M6 6h15v20H6z" {...line} fill="currentColor" fillOpacity="0.08" />
          <path d="M21 6l4 2v20l-4-2M6 26l4 2h15" {...line} />
        </>
      )}
      {kind === 'rolled' && (
        <>
          <path d="M8 5h16v16H8z" {...line} fill="currentColor" fillOpacity="0.08" />
          <rect x="5" y="20.5" width="22" height="6.5" rx="3.25" {...line} />
        </>
      )}
      {kind === 'softboard' && (
        <>
          <path d="M6 6h17v20H6z" {...line} fill="currentColor" fillOpacity="0.08" />
          <path d="M23 6l2 1.2v20L23 26" {...line} />
        </>
      )}
      {kind === 'sticker' && (
        <>
          <path d="M6 6h20v13l-7 7H6z" {...line} fill="currentColor" fillOpacity="0.08" />
          <path d="M26 19h-7v7" {...line} />
        </>
      )}
      {(kind === 'paper' || kind === 'generic') && (
        <path d="M8 5h16v22H8z" {...line} fill="currentColor" fillOpacity="0.08" />
      )}
    </svg>
  );
}

export default function FinishExplorer({ finishes, activeKey, onPick, art, ratio, shownAt, formatPrice }) {
  const active = finishes.find((finish) => finish.key === activeKey) || finishes[0];
  const { rotateX, rotateY, turned, backOn, showSide, stageProps } = useTurntable(active.key);
  const count = NUMBER_WORDS[finishes.length] || finishes.length;
  const backLabel = active.kind === 'stretched' ? 'See the wooden frame' : 'See the back';

  return (
    <section aria-labelledby="finish-title" className="bg-white pb-20 md:pb-28">
      <div className="mx-auto max-w-7xl section-padding">
        {/* A hairline under the buy box, across its content width */}
        <div className="border-t border-black/[0.06] pt-12 md:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="apple-eyebrow uppercase text-accent">Choose your finish</p>
            <h2 id="finish-title" className="apple-headline mt-3 font-heading">
              <span className="text-[#1d1d1f]">One artwork.</span>{' '}
              <span className="text-[#86868b]">{count} ways to own it.</span>
            </h2>
            <p className="apple-body mt-4 max-w-[56ch] text-[#6e6e73]">
              Every finish is printed with the same eco-solvent inks. Pick one and drag it round to see every side — your selection above changes with it.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-12 lg:gap-10">
            {/* Picker: a swipeable row on phones, a column beside the stage on desktop */}
            <div
              role="group"
              aria-label="Finish"
              className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide sm:-mx-6 sm:px-6 lg:col-span-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
            >
              {finishes.map((finish) => {
                const on = finish.key === active.key;
                return (
                  <button
                    key={finish.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onPick({ material: finish.material, frame: finish.frame })}
                    className={`group flex min-w-[252px] items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 lg:min-w-0 lg:px-5 lg:py-4 ${
                      on
                        ? 'border-[#1d1d1f] bg-white text-[#1d1d1f] shadow-[0_14px_30px_-20px_rgba(0,0,0,0.5)]'
                        : 'border-black/10 bg-[#faf8f4] text-[#6e6e73] hover:border-black/30 hover:text-[#1d1d1f]'
                    }`}
                  >
                    <FinishGlyph kind={finish.kind} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-snug text-[#1d1d1f]">{finish.name}</span>
                      {finish.minPrice > 0 && (
                        <span className="block text-[13px] leading-snug text-[#6e6e73]">from {formatPrice(finish.minPrice)}</span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-white' : 'border-black/20'}`}
                    >
                      {on && <LuCheck className="size-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8">
              {/* Stage: a lit wall, and the turntable — drag anywhere on it to turn
                  the piece. It's a size container so the models scale with it.
                  A slider's children are presentational to screen readers, so the
                  hint and the button sit over it rather than inside it. */}
              <div className="relative">
                <div
                  {...stageProps}
                  role="slider"
                  tabIndex={0}
                  aria-label={`Turn the ${active.name.toLowerCase()} preview`}
                  aria-valuemin={0}
                  aria-valuemax={359}
                  aria-describedby="finish-turn-help"
                  className="relative isolate aspect-[5/4] cursor-grab select-none overflow-hidden rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:cursor-grabbing sm:aspect-[16/11]"
                  style={{ containerType: 'size', touchAction: 'pan-y', background: 'radial-gradient(75% 65% at 50% 36%, #fdfbf7 0%, #f1eadd 62%, #e6dccb 100%)' }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={active.key}
                      className="absolute inset-0 grid place-items-center pb-[5%]"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <FinishMockup kind={active.kind} src={art} ratio={ratio} rotateX={rotateX} rotateY={rotateY} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Shown until it's been turned once */}
                <p
                  id="finish-turn-help"
                  className={`pointer-events-none absolute left-1/2 top-4 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/85 px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] shadow-sm backdrop-blur transition-opacity duration-500 sm:top-5 ${turned ? 'opacity-0' : 'opacity-100'}`}
                >
                  <LuRotate3D aria-hidden="true" className="size-4 text-accent" />
                  Drag to turn it round
                  <span className="sr-only">, or use the arrow keys. Home puts it back.</span>
                </p>
                {shownAt && (
                  <p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] shadow-sm backdrop-blur sm:bottom-5 sm:left-5">
                    Shown at {shownAt}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => showSide(!backOn)}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3.5 py-2 text-[12px] font-medium text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:bottom-5 sm:right-5"
                >
                  <LuRotateCw aria-hidden="true" className="size-3.5" />
                  {backOn ? 'See the front' : backLabel}
                </button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start"
                  aria-live="polite"
                >
                  <div>
                    <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{active.name}</h3>
                    {active.tagline && <p className="mt-1.5 max-w-[52ch] text-[16px] leading-relaxed text-[#6e6e73]">{active.tagline}</p>}
                    {active.specs.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {active.specs.map((spec) => (
                          <li key={spec} className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f0e9] px-3 py-1.5 text-[13px] font-medium text-[#1d1d1f]">
                            <LuCheck aria-hidden="true" className="size-3.5 text-secondary" strokeWidth={2.5} />
                            {spec}
                          </li>
                        ))}
                      </ul>
                    )}
                    {active.bestFor && (
                      <p className="mt-4 text-[14px] text-[#6e6e73]">
                        <span className="font-semibold text-[#1d1d1f]">Best for:</span> {active.bestFor}
                      </p>
                    )}
                  </div>
                  {active.minPrice > 0 && (
                    <div className="sm:text-right">
                      <p className="text-[13px] text-[#6e6e73]">from</p>
                      <p className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-accent">{formatPrice(active.minPrice)}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
