import { useState } from 'react';
import { motion } from 'framer-motion';
import { LuArrowUp, LuRuler, LuShoppingBag } from 'react-icons/lu';
import { handleImageError } from '../../../utils/imageOptimizer';
import { formatLength, isInchSize, orient, parseSize, sizeLabel } from './storyData';

/* ── True to scale ────────────────────────────────────────────────────────────
   The selected size drawn to scale in a room: a canvas above an 84-inch sofa,
   a nameplate beside a 36 × 84-inch front door, hung the way its artwork is
   shaped. Everything in a scene is laid out in inches and converted to
   percentages of the scene, so it scales with the screen and stays true. The
   size buttons here pick the size in the buy box, like the finish explorer's
   buttons. */

// Inches. The floor band sits under the floor line (y = 0).
const SCENES = {
  sofa: {
    width: 168,
    height: 112,
    floor: 8,
    // Centred, 9 in above the sofa's 33 in back
    place: (w) => ({ x: (168 - w) / 2, y: 42 }),
    note: (unit) => `Sofa ${formatLength(84, unit)} wide · art hung ${formatLength(9, unit)} above it`,
  },
  door: {
    width: 150,
    height: 100,
    floor: 6,
    // Centred at eye level on the wall beside the door
    place: (w, h) => ({ x: 98 - w / 2, y: 60 - h / 2 }),
    note: (unit) => `Door ${formatLength(36, unit)} × ${formatLength(84, unit)} · plate centred ${formatLength(60, unit)} up`,
  },
};

const box = (scene, x, y, w, h) => ({
  left: `${(x / scene.width) * 100}%`,
  bottom: `${((y + scene.floor) / scene.height) * 100}%`,
  width: `${(w / scene.width) * 100}%`,
  height: `${(h / scene.height) * 100}%`,
});

// How far off the wall each finish sits, as its shadow
const DEPTH_SHADOW = {
  stretched: '3px 4px 0 rgba(0,0,0,0.22), 0 14px 22px -10px rgba(0,0,0,0.45)',
  softboard: '1.5px 2px 0 rgba(0,0,0,0.12), 0 10px 16px -10px rgba(0,0,0,0.35)',
  generic: '0 8px 14px -8px rgba(0,0,0,0.35)',
};

/* ── Furniture, drawn in inches ── */

function Sofa() {
  return (
    <svg viewBox="0 0 84 33" aria-hidden="true" className="absolute size-full" preserveAspectRatio="none">
      <rect x="7" y="29" width="2.2" height="4" rx="0.6" fill="#3a2a1c" />
      <rect x="74.8" y="29" width="2.2" height="4" rx="0.6" fill="#3a2a1c" />
      <rect x="6" y="1" width="72" height="21" rx="4" fill="#1b5a3f" />
      <rect x="1" y="19" width="82" height="11" rx="3" fill="#174e37" />
      <rect x="10" y="3" width="31.5" height="15" rx="4" fill="#23694a" />
      <rect x="42.5" y="3" width="31.5" height="15" rx="4" fill="#23694a" />
      <rect x="10" y="16" width="31.8" height="7" rx="3" fill="#287353" />
      <rect x="42.2" y="16" width="31.8" height="7" rx="3" fill="#287353" />
      <rect x="0" y="9" width="11" height="21" rx="4.5" fill="#1f6045" />
      <rect x="73" y="9" width="11" height="21" rx="4.5" fill="#1f6045" />
      <rect x="13" y="7.5" width="10" height="9" rx="3" fill="#efe3cc" transform="rotate(-6 18 12)" />
      <rect x="61" y="7.5" width="10" height="9" rx="3" fill="#d9774f" transform="rotate(7 66 12)" />
      <rect x="6" y="1" width="72" height="3" rx="1.5" fill="#fff" opacity="0.06" />
    </svg>
  );
}

function SideTableLamp() {
  return (
    <svg viewBox="0 0 24 52" aria-hidden="true" className="absolute size-full" preserveAspectRatio="none">
      <path d="M5 0h14l3 11H2z" fill="#f6ead2" />
      <rect x="11.3" y="11" width="1.4" height="7" fill="#b08a4a" />
      <ellipse cx="12" cy="22" rx="5" ry="4" fill="#cdbba1" />
      <rect x="0" y="26" width="24" height="2" rx="1" fill="#6b4a2f" />
      <rect x="10.5" y="28" width="3" height="21" fill="#5a3d26" />
      <rect x="5" y="49" width="14" height="3" rx="1.5" fill="#5a3d26" />
    </svg>
  );
}

// A snake plant in a pot
function Plant({ pot = '#c46f47' }) {
  return (
    <svg viewBox="0 0 22 54" aria-hidden="true" className="absolute size-full" preserveAspectRatio="none">
      <path d="M8 40C5 32 2 24 1 17c4 7 7 14 9 23z" fill="#3d7d56" />
      <path d="M9 40C7 28 6 16 8 4c2 12 3 24 3 36z" fill="#2f6b48" />
      <path d="M11 40c0-14 1-28 3-38 1 12 0 26-1 38z" fill="#4b8c63" />
      <path d="M12 40c2-10 5-20 8-28-1 12-4 20-6 28z" fill="#2f6b48" />
      <path d="M10 40c-1-8-1-16 1-22 1 8 1 15 1 22z" fill="#5d9c72" />
      <path d="M4 40h14l-1.5 14h-11z" fill={pot} />
      <rect x="3.5" y="39" width="15" height="2.4" rx="1" fill={pot} />
      <rect x="3.5" y="39" width="15" height="2.4" rx="1" fill="#000" opacity="0.12" />
    </svg>
  );
}

function FrontDoor() {
  return (
    <svg viewBox="0 0 42 87" aria-hidden="true" className="absolute size-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="story-door-wood" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6a4529" />
          <stop offset="0.5" stopColor="#80563a" />
          <stop offset="1" stopColor="#5f3d23" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="42" height="87" fill="#2f2117" />
      <rect x="3" y="3" width="36" height="84" fill="url(#story-door-wood)" />
      {[10, 17, 24, 31].map((x) => (
        <rect key={x} x={x} y="7" width="0.35" height="76" fill="#000" opacity="0.22" />
      ))}
      <rect x="33.5" y="32" width="1.6" height="26" rx="0.8" fill="#d8b46c" />
      <rect x="33.5" y="32" width="0.5" height="26" rx="0.25" fill="#fff" opacity="0.35" />
    </svg>
  );
}

function Doorbell() {
  return (
    <svg viewBox="0 0 3 4.5" aria-hidden="true" className="absolute size-full">
      <rect x="0.1" y="0.1" width="2.8" height="4.3" rx="0.5" fill="#f7f5f0" stroke="#cfc7b8" strokeWidth="0.15" />
      <circle cx="1.5" cy="2.25" r="0.65" fill="#d8b46c" />
    </svg>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full bg-[#f0ede6] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            value === option.value ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function ScaleScene({
  ref, kind, finishKind, product, art, sizeOptions, selectedSize, isCustomSize, orientation,
  onPick, onCustomSize, priceText, pickLabel, cta, formatPrice,
}) {
  const [unit, setUnit] = useState('in');
  const scene = SCENES[kind === 'nameplate' ? 'door' : 'sofa'];
  const dims = isCustomSize ? null : parseSize(selectedSize);
  const size = dims ? orient(dims, orientation) : null;
  const spot = size ? scene.place(size.w, size.h) : null;
  const artBox = size ? box(scene, spot.x, spot.y, size.w, size.h) : null;
  // Dimension lines only where there's room for them; the width goes under
  // the art when its top is close to the ceiling
  const roomy = size && size.w / scene.width > 0.09;
  const nearCeiling = size && spot.y + size.h > scene.height - scene.floor - 8;
  const nameplate = kind === 'nameplate';

  const reveal = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    // The buy box's "Not sure which size?" shortcut scrolls here and focuses
    // it; its own top padding clears the fixed header
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="scale-title"
      className="scroll-mt-4 bg-[#fbfaf7] px-5 py-20 outline-none sm:px-8 md:scroll-mt-0 md:py-28"
    >
      <div className="mx-auto max-w-[1200px]">
        <motion.div {...reveal}>
          <p className="apple-eyebrow uppercase text-accent">Size & scale</p>
          <h2 id="scale-title" className="apple-headline mt-3 font-heading">
            <span className="text-[#1d1d1f]">{nameplate ? 'Sized for your front door.' : 'True to scale.'}</span>{' '}
            <span className="text-[#86868b]">{nameplate ? 'See it at eye level.' : 'See it above a real sofa.'}</span>
          </h2>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          {/* The room */}
          <motion.div {...reveal} className="lg:col-span-8">
            <div
              className="relative isolate w-full overflow-hidden rounded-[28px] ring-1 ring-black/5"
              style={{ aspectRatio: `${scene.width} / ${scene.height}` }}
            >
              {/* Wall, lit from above, and floor */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10"
                style={{
                  background: nameplate
                    ? 'radial-gradient(60% 55% at 65% 30%, #f1e8da 0%, #e3d7c4 70%, #d6c8b1 100%)'
                    : 'radial-gradient(70% 60% at 50% 25%, #f7f3ec 0%, #ede6da 70%, #e2d9ca 100%)',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: `${(scene.floor / scene.height) * 100}%`,
                  background: nameplate ? 'linear-gradient(180deg, #cdc2b0, #b9ad98)' : 'linear-gradient(180deg, #bda283, #a3876a)',
                }}
              />

              {nameplate ? (
                <>
                  <div aria-hidden="true" className="absolute" style={box(scene, 20, 0, 42, 87)}>
                    <FrontDoor />
                  </div>
                  <div aria-hidden="true" className="absolute" style={box(scene, 69, 45, 3, 4.5)}>
                    <Doorbell />
                  </div>
                  {/* Wall light over the plate, washing the wall below it */}
                  <div aria-hidden="true" className="absolute" style={box(scene, 95.5, 78, 5, 6)}>
                    <span className="absolute inset-0 rounded-[2px] bg-[#232323] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                  </div>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute"
                    style={{ ...box(scene, 74, 36, 48, 42), background: 'radial-gradient(50% 100% at 50% 0%, rgba(255,214,150,0.55), rgba(255,214,150,0.12) 55%, transparent 80%)' }}
                  />
                  <div aria-hidden="true" className="absolute" style={box(scene, 126, 0, 20, 50)}>
                    <Plant pot="#3b3a37" />
                  </div>
                </>
              ) : (
                <>
                  <div aria-hidden="true" className="absolute inset-x-0 bg-[#f8f5ef]" style={{ bottom: `${(scene.floor / scene.height) * 100}%`, height: `${(3.5 / scene.height) * 100}%` }} />
                  {/* The table lamp's glow on the wall */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute"
                    style={{ ...box(scene, 118, 26, 60, 50), background: 'radial-gradient(closest-side, rgba(255,212,140,0.35), transparent)' }}
                  />
                  <div aria-hidden="true" className="absolute" style={box(scene, 12, 0, 22, 54)}>
                    <Plant />
                  </div>
                  <div aria-hidden="true" className="absolute" style={box(scene, 42, 0, 84, 33)}>
                    <Sofa />
                  </div>
                  <div aria-hidden="true" className="absolute" style={box(scene, 136, 0, 24, 52)}>
                    <SideTableLamp />
                  </div>
                </>
              )}

              {artBox && (
                <motion.div
                  className="absolute"
                  initial={false}
                  animate={artBox}
                  transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                >
                  {nameplate ? (
                    // The trimmed design can keep white corners (a round plate):
                    // multiply drops them into the wall. The dashed box is the
                    // size's footprint, since the plate's shape varies.
                    <div className="absolute inset-0 rounded-[3px] outline-dashed outline-1 outline-offset-2 outline-[#5c4318]/35">
                      {art && (
                        <img src={art} alt="" draggable={false} loading="lazy" onError={handleImageError} className="size-full object-contain mix-blend-multiply" />
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 overflow-hidden bg-[#efe8da]" style={{ boxShadow: DEPTH_SHADOW[finishKind] || DEPTH_SHADOW.generic }}>
                      {art && (
                        <img src={art} alt="" draggable={false} loading="lazy" onError={handleImageError} className="size-full object-cover" />
                      )}
                    </div>
                  )}

                  {roomy && (
                    <>
                      <div aria-hidden="true" className={`absolute inset-x-0 hidden items-center sm:flex ${nearCeiling ? '-bottom-6' : '-top-6'}`}>
                        <span className="h-2.5 w-px bg-[#1d1d1f]/50" />
                        <span className="h-px flex-1 bg-[#1d1d1f]/35" />
                        <span className="mx-1.5 whitespace-nowrap rounded-full bg-white/85 px-1.5 text-[11px] font-medium tabular-nums text-[#1d1d1f]">
                          {formatLength(size.w, unit)}
                        </span>
                        <span className="h-px flex-1 bg-[#1d1d1f]/35" />
                        <span className="h-2.5 w-px bg-[#1d1d1f]/50" />
                      </div>
                      <div aria-hidden="true" className="absolute inset-y-0 -right-7 hidden flex-col items-center sm:flex">
                        <span className="h-px w-2.5 bg-[#1d1d1f]/50" />
                        <span className="w-px flex-1 bg-[#1d1d1f]/35" />
                        <span className="my-1.5 whitespace-nowrap rounded-full bg-white/85 px-1.5 text-[11px] font-medium tabular-nums text-[#1d1d1f] [writing-mode:vertical-rl]">
                          {formatLength(size.h, unit)}
                        </span>
                        <span className="w-px flex-1 bg-[#1d1d1f]/35" />
                        <span className="h-px w-2.5 bg-[#1d1d1f]/50" />
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {isCustomSize && (
                <div className="absolute inset-x-6 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-white/90 p-5 text-center shadow-lg backdrop-blur">
                  <p className="text-[15px] font-semibold text-[#1d1d1f]">Your own size</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6e6e73]">We’ll confirm the exact dimensions and price with you when we call.</p>
                </div>
              )}
            </div>

            <p className="mt-3 text-[12px] text-[#86868b]">
              {size && `Shown at ${formatLength(size.w, unit)} × ${formatLength(size.h, unit)}. `}
              {scene.note(unit)}.
              {nameplate && ' Sizes are approximate: the final shape follows the design.'}
            </p>
          </motion.div>

          {/* Controls and the pick */}
          <motion.div {...reveal} className="flex flex-col gap-7 lg:col-span-4">
            {sizeOptions.length > 0 && (
              <div>
                <p className="text-[13px] font-semibold text-[#1d1d1f]">Size</p>
                <div role="group" aria-label="Size" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {sizeOptions.map((option) => {
                    const on = !isCustomSize && option.size === selectedSize;
                    return (
                      <button
                        key={option.size}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onPick({ size: option.size })}
                        className={`rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                          on ? 'border-[#1d1d1f] bg-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.6)]' : 'border-black/10 bg-white/60 hover:border-black/30'
                        }`}
                      >
                        <span className="block text-[15px] font-semibold tabular-nums text-[#1d1d1f]">
                          {sizeLabel(option.size)}
                          {isInchSize(option.size) && <span className="font-normal text-[#86868b]"> in</span>}
                        </span>
                        {option.price > 0 && <span className="block text-[13px] tabular-nums text-[#6e6e73]">{formatPrice(option.price)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* A block around it, so the column doesn't stretch it full width */}
            <div>
              <Segmented
                label="Units"
                value={unit}
                onChange={setUnit}
                options={[{ value: 'in', label: 'in' }, { value: 'cm', label: 'cm' }]}
              />
            </div>

            {nameplate ? (
              !isCustomSize && (
                <p className="flex gap-3 rounded-2xl bg-[#f3efe6] p-4 text-[13px] leading-relaxed text-[#6e6e73]">
                  <LuRuler aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
                  <span>
                    Need another size?{' '}
                    <button type="button" onClick={onCustomSize} className="font-semibold text-secondary underline decoration-secondary/30 underline-offset-2 hover:text-accent">
                      Ask for a custom size
                    </button>{' '}
                    and we’ll call you with a price.
                  </span>
                </p>
              )
            ) : (
              <p className="flex gap-3 rounded-2xl bg-[#f3efe6] p-4 text-[13px] leading-relaxed text-[#6e6e73]">
                <LuRuler aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
                <span>
                  <span className="font-semibold text-[#1d1d1f]">Rule of thumb:</span> art about two-thirds the width of the furniture under it
                  looks best — around {formatLength(56, unit)} over an {formatLength(84, unit)} sofa.
                </span>
              </p>
            )}

            <div className="mt-auto rounded-3xl bg-white p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
              <p className="apple-eyebrow uppercase text-[#86868b]">Your pick</p>
              <p className="mt-2 text-[15px] font-medium leading-snug text-[#1d1d1f]">{pickLabel}</p>
              {priceText && <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-accent">{priceText}</p>}
              <button
                type="button"
                onClick={cta.onClick}
                className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-[16px]"
              >
                {/* An arrow when the button takes you up to the buy box instead */}
                {cta.up ? <LuArrowUp aria-hidden="true" className="size-5" /> : <LuShoppingBag aria-hidden="true" className="size-5" />}
                {cta.label}
              </button>
              <p className="mt-3 text-center text-[12px] text-[#86868b]">{product.name}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
