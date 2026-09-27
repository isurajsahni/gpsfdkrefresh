import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { LuLayers } from 'react-icons/lu';
import { handleImageError } from '../../../utils/imageOptimizer';

/* ── Anatomy of a nameplate ───────────────────────────────────────────────────
   The plate taken apart in an isometric, exploded view: the vinyl design, the
   acrylic base it sits on, and the corner fixings from the hanging kit, in
   front of the wall, with guide lines from each fixing to its hole. It comes
   apart as it scrolls into view and goes back together on request; pointing
   at a layer in the key lifts it out. The model takes the plate's own
   proportions, and sizes and depths are in cqw so it scales with its stage.

   Opacity flattens preserve-3d, so a faded layer loses its thickness while
   it's faded; the guide lines are kept out of any faded element so they stay
   upright. */

const LAYERS = [
  { id: 'vinyl', title: 'Matte vinyl finish', text: 'Your design, family name and house number, with a smooth, elegant finish.' },
  { id: 'acrylic', title: 'Durable acrylic base', text: 'Lightweight yet sturdy, and weather-resistant for outdoor walls.' },
  { id: 'kit', title: 'Hanging kit', text: 'Included in the box, for easy installation.' },
];

const ACRYLIC = 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(206,226,236,0.6) 50%, rgba(255,255,255,0.8))';
const BRASS_CAP = 'radial-gradient(circle at 38% 34%, #fff3cf 0%, #d9b26a 38%, #8d6727 80%)';
const CORNERS = ['left-[6%] top-[8%]', 'right-[6%] top-[8%]', 'bottom-[8%] left-[6%]', 'bottom-[8%] right-[6%]'];

const SPRING = { type: 'spring', stiffness: 60, damping: 15 };

function Swatch({ id, design }) {
  if (id === 'vinyl') {
    return (
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
        {design && <img src={design} alt="" className="size-full object-cover" onError={handleImageError} />}
      </span>
    );
  }
  if (id === 'acrylic') {
    return <span className="size-11 shrink-0 rounded-xl ring-1 ring-[#9fb8c6]/60" style={{ background: ACRYLIC }} />;
  }
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f3efe6] ring-1 ring-black/5">
      <span className="size-4 rounded-full" style={{ background: BRASS_CAP }} />
    </span>
  );
}

export default function NameplateAnatomy({ design, ratio, name }) {
  const stageRef = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(stageRef, { once: true, amount: 0.45 });
  const [assembled, setAssembled] = useState(false);
  const [focus, setFocus] = useState(null);
  const exploded = (inView || reduce) && !assembled;

  // The plate's footprint on the stage, in cqw: its own shape, within 50 × 34
  const shape = Math.min(2.2, Math.max(0.75, ratio || 1.5));
  const plateW = Math.min(50, 34 * shape);
  const plateH = plateW / shape;

  // Distance of each layer from the acrylic base, in cqw
  const depth = exploded ? { kit: 21, vinyl: 11, wall: -13 } : { kit: 1.4, vinyl: 0.7, wall: -4 };
  const lift = (id) => (focus === id ? 3.5 : 0);
  const fade = (id) => (focus && focus !== id ? 0.28 : 1);
  const kitZ = depth.kit + lift('kit');

  return (
    <section aria-labelledby="anatomy-title" className="bg-white px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="apple-eyebrow uppercase text-accent">Anatomy</p>
          <h2 id="anatomy-title" className="apple-headline mt-3 font-heading">
            <span className="text-[#1d1d1f]">Made in layers.</span>{' '}
            <span className="text-[#86868b]">Made to last outdoors.</span>
          </h2>
        </motion.div>

        <div className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-12">
          <div
            ref={stageRef}
            className="relative isolate aspect-[4/3] overflow-hidden rounded-[28px] lg:col-span-7"
            style={{ containerType: 'inline-size', background: 'radial-gradient(70% 70% at 50% 40%, #fbf9f5 0%, #f1ece2 70%, #e8e1d4 100%)' }}
          >
            <div className="absolute inset-0 grid place-items-center" style={{ perspective: '220cqw' }}>
              <div
                className="relative"
                style={{ width: `${plateW}cqw`, height: `${plateH}cqw`, transformStyle: 'preserve-3d', transform: 'rotateX(54deg) rotateZ(-32deg)' }}
              >
                {/* Wall: a drawing grid, drill marks where the fixings go, and the plate's shadow */}
                <motion.div
                  aria-hidden="true"
                  className="absolute -inset-[45%]"
                  initial={false}
                  animate={{ z: `${depth.wall}cqw` }}
                  transition={SPRING}
                  style={{
                    backgroundImage: 'linear-gradient(rgba(29,29,31,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(29,29,31,0.07) 1px, transparent 1px)',
                    backgroundSize: '4cqw 4cqw',
                  }}
                >
                  <span className="absolute inset-[31%] rounded-[1cqw] bg-black/15 blur-[2cqw]" />
                </motion.div>

                {/* Acrylic base, with a little thickness under it */}
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0"
                  initial={false}
                  animate={{ z: `${lift('acrylic')}cqw`, opacity: fade('acrylic') }}
                  transition={SPRING}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {[0.6, 0.4, 0.2].map((z) => (
                    <span key={z} className="absolute inset-0 rounded-[1.2cqw] bg-[#b8ccd6]/50" style={{ transform: `translateZ(-${z}cqw)` }} />
                  ))}
                  <span
                    className="absolute inset-0 rounded-[1.2cqw]"
                    style={{ background: ACRYLIC, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.95), 0 0 0 1px rgba(110,140,160,0.35)' }}
                  />
                  {CORNERS.map((corner) => (
                    <span key={corner} className={`absolute ${corner} size-[2.2cqw] rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]`} />
                  ))}
                </motion.div>

                {/* Vinyl: the printed design */}
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-[3%] overflow-hidden rounded-[0.9cqw] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                  initial={false}
                  animate={{ z: `${depth.vinyl + lift('vinyl')}cqw`, opacity: fade('vinyl') }}
                  transition={SPRING}
                >
                  {design && <img src={design} alt="" draggable={false} onError={handleImageError} className="size-full object-cover" />}
                </motion.div>

                {/* Fixings from the hanging kit, each with a guide line back to its hole */}
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0"
                  initial={false}
                  animate={{ z: `${kitZ}cqw` }}
                  transition={SPRING}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {CORNERS.map((corner) => (
                    <span key={corner} className={`absolute ${corner} size-[2.2cqw]`} style={{ transformStyle: 'preserve-3d' }}>
                      <motion.span
                        className="absolute left-1/2 top-1/2 w-px origin-top"
                        initial={false}
                        animate={{ height: `${kitZ}cqw`, opacity: fade('kit') * 0.9 }}
                        transition={SPRING}
                        style={{
                          transform: 'rotateX(-90deg)',
                          background: 'repeating-linear-gradient(to bottom, rgba(92,67,24,0.6) 0 3px, transparent 3px 7px)',
                        }}
                      />
                      <motion.span
                        className="absolute inset-0"
                        initial={false}
                        animate={{ opacity: fade('kit') }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {[1.2, 0.8, 0.4].map((z) => (
                          <span key={z} className="absolute inset-0 rounded-full bg-[#7b5a22]" style={{ transform: `translateZ(-${z}cqw)` }} />
                        ))}
                        <span className="absolute inset-0 rounded-full" style={{ background: BRASS_CAP }} />
                      </motion.span>
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAssembled((value) => !value)}
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3.5 py-2 text-[12px] font-medium text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:bottom-5 sm:right-5"
            >
              <LuLayers aria-hidden="true" className="size-3.5" />
              {exploded ? 'Put it together' : 'Take it apart'}
            </button>
          </div>

          <ol className="space-y-3 lg:col-span-5">
            {LAYERS.map((layer, index) => (
              <li key={layer.id}>
                <button
                  type="button"
                  onMouseEnter={() => setFocus(layer.id)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(layer.id)}
                  onBlur={() => setFocus(null)}
                  onClick={() => setFocus((current) => (current === layer.id ? null : layer.id))}
                  aria-pressed={focus === layer.id}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                    focus === layer.id ? 'border-[#1d1d1f] bg-white shadow-[0_14px_30px_-20px_rgba(0,0,0,0.5)]' : 'border-black/10 bg-[#faf8f4]'
                  }`}
                >
                  <Swatch id={layer.id} design={design} />
                  <span>
                    <span className="flex items-baseline gap-2">
                      <span className="text-[12px] font-semibold tabular-nums text-accent">0{index + 1}</span>
                      <span className="text-[16px] font-semibold text-[#1d1d1f]">{layer.title}</span>
                    </span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-[#6e6e73]">{layer.text}</span>
                  </span>
                </button>
              </li>
            ))}
            <li className="px-1 pt-2 text-[13px] text-[#86868b]">
              {name} is made to order for your home. Point at a layer to see where it sits.
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
