import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { handleImageError } from '../../../utils/imageOptimizer';

/* ── Finish mockups ───────────────────────────────────────────────────────────
   Each finish drawn with the product's own artwork, at the proportions of the
   selected size. They render inside the finish explorer's stage, which is a
   size container: cqw/cqh keep every mockup inside it at any width. */

// As large as fits both ways inside the stage
const fit = (ratio, maxW, maxH) => ({ width: `min(${maxW}cqw, calc(${maxH}cqh * ${ratio}))`, aspectRatio: `${ratio}` });

// Unprinted canvas: a fine linen weave
const LINEN =
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 3px)';

// A roll of canvas seen from the front: the unprinted back, lit from above
const ROLL = 'linear-gradient(180deg, #8d8a82 0%, #d6d2c9 16%, #f6f4ef 40%, #ffffff 48%, #e4e0d7 68%, #aaa59b 88%, #85817a 100%)';

const EASE = [0.22, 1, 0.36, 1];

function Art({ src }) {
  if (!src) return <div className="absolute inset-0 bg-[#efe8da]" style={{ backgroundImage: LINEN }} />;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={handleImageError}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

// An edge face showing the strip of print that wraps round it, shaded
const wrapped = (src, position, direction, stops) =>
  src
    ? `linear-gradient(${direction}, ${stops}), url("${src}") ${position} no-repeat`
    : `linear-gradient(${direction}, ${stops}), #efe8da`;

// The back of a stretched canvas: raw canvas stapled over wooden stretcher bars
function StretcherBack() {
  const bar = 'absolute bg-[#c79a5e]';
  const grainAcross = 'repeating-linear-gradient(90deg, rgba(120,72,24,0.18) 0 1px, transparent 1px 7px), linear-gradient(180deg, #d9ae70, #b58149)';
  const grainDown = 'repeating-linear-gradient(0deg, rgba(120,72,24,0.18) 0 1px, transparent 1px 7px), linear-gradient(90deg, #d9ae70, #b58149)';
  const thickness = 'max(10px, 2.6cqw)';
  return (
    <div className="absolute inset-0 bg-[#ece3d1]" style={{ backgroundImage: LINEN }}>
      <span className={`${bar} inset-x-0 top-0`} style={{ height: thickness, backgroundImage: grainAcross }} />
      <span className={`${bar} inset-x-0 bottom-0`} style={{ height: thickness, backgroundImage: grainAcross }} />
      <span className={`${bar} inset-y-0 left-0`} style={{ width: thickness, backgroundImage: grainDown }} />
      <span className={`${bar} inset-y-0 right-0`} style={{ width: thickness, backgroundImage: grainDown }} />
      {/* The canvas folds over the bars and is stapled down */}
      <span className="absolute inset-0 border-[5px] border-[#e9dfcb] outline-dashed outline-2 -outline-offset-[4px] outline-[#6b6457]/50" />
      <span className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Slab({ src, ratio, depth, edge, rotateY, flipped, back }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid place-items-center" style={{ perspective: 1400 }}>
      <motion.div
        className="relative"
        style={{ ...fit(ratio, 54, 62), transformStyle: 'preserve-3d' }}
        initial={reduce ? false : { rotateY: 0, rotateX: 0 }}
        // Flipped, it turns half round: the back, at the same angle as the front
        animate={{ rotateY: flipped ? 180 + rotateY : rotateY, rotateX: 5 }}
        transition={{ type: 'spring', stiffness: 50, damping: 14 }}
      >
        <div className="absolute inset-0 overflow-hidden shadow-[0_40px_60px_-34px_rgba(0,0,0,0.6)] [backface-visibility:hidden]">
          <Art src={src} />
          <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.16),transparent_42%,rgba(0,0,0,0.08))]" />
        </div>
        <span
          aria-hidden="true"
          className="absolute left-full top-0 h-full origin-left [backface-visibility:hidden]"
          style={{ width: depth, transform: 'rotateY(90deg)', background: edge('right center / auto 100%', '90deg') }}
        />
        <span
          aria-hidden="true"
          className="absolute right-full top-0 h-full origin-right [backface-visibility:hidden]"
          style={{ width: depth, transform: 'rotateY(-90deg)', background: edge('left center / auto 100%', '270deg') }}
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-full w-full origin-top [backface-visibility:hidden]"
          style={{ height: depth, transform: 'rotateX(-90deg)', background: edge('center bottom / 100% auto', '180deg') }}
        />
        {back && (
          <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: `translateZ(-${depth}px) rotateY(180deg)` }}>
            {back}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Stretched({ src, ratio, flipped }) {
  return (
    <Slab
      src={src}
      ratio={ratio}
      depth={16}
      rotateY={-24}
      flipped={flipped}
      back={<StretcherBack />}
      edge={(position, direction) => wrapped(src, position, direction, `rgba(0,0,0,0.3), rgba(0,0,0,0.5)`)}
    />
  );
}

function SoftBoard({ src, ratio }) {
  return (
    <div className="relative grid place-items-center">
      <Slab
        src={src}
        ratio={ratio}
        depth={9}
        rotateY={-32}
        // Sunboard is white foam right through
        edge={(_, direction) => `linear-gradient(${direction}, #ffffff, #e2e2dc)`}
      />
      {/* Half the board's width out from the centre, i.e. just past its edge */}
      <span
        className="absolute top-1/2 hidden -translate-y-1/2 items-center gap-2 whitespace-nowrap text-[12px] font-medium text-[#1d1d1f] sm:flex"
        style={{ left: `calc(50% + min(27cqw, calc(31cqh * ${ratio})))` }}
      >
        <span aria-hidden="true" className="h-px w-6 bg-[#1d1d1f]/40" />
        5 mm sunboard
      </span>
    </div>
  );
}

function Rolled({ src, ratio }) {
  const reduce = useReducedMotion();
  const open = 86; // how far down it's unrolled, in %
  const unroll = { duration: 1.3, ease: EASE, delay: 0.15 };
  return (
    <div className="relative" style={fit(ratio, 52, 58)}>
      <div className="absolute inset-0 drop-shadow-[0_18px_22px_rgba(0,0,0,0.28)]">
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={reduce ? false : { clipPath: 'inset(0% 0% 94% 0%)' }}
          animate={{ clipPath: `inset(0% 0% ${100 - open}% 0%)` }}
          transition={unroll}
        >
          <Art src={src} />
          <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent_30%,rgba(0,0,0,0.14))]" />
        </motion.div>
      </div>
      <motion.span
        aria-hidden="true"
        className="absolute -left-[2.5%] -right-[2.5%] h-[max(16px,5.5cqh)] -translate-y-1/2 rounded-full"
        style={{ background: ROLL, boxShadow: '0 14px 18px -10px rgba(0,0,0,0.45)' }}
        initial={reduce ? false : { top: '6%' }}
        animate={{ top: `${open}%` }}
        transition={unroll}
      >
        {/* Where the outer turn of canvas ends */}
        <span className="absolute inset-x-[3%] top-[64%] h-px bg-black/15" />
      </motion.span>
    </div>
  );
}

function Sticker({ src, ratio }) {
  const reduce = useReducedMotion();
  // Share of the width peeled back. The corner folds at 45°: as far up the
  // right edge as along the bottom, which in % of the height is × ratio.
  const fold = useMotionValue(reduce ? 0.2 : 0);
  const corner = (f) => ({ x: 100 - f * 100, y: 100 - f * 100 * ratio });
  const artClip = useTransform(fold, (f) => {
    const { x, y } = corner(f);
    return `polygon(0 0, 100% 0, 100% ${y}%, ${x}% 100%, 0 100%)`;
  });
  const flapClip = useTransform(fold, (f) => {
    const { x, y } = corner(f);
    return `polygon(100% ${y}%, ${x}% 100%, ${x}% ${y}%)`;
  });

  useEffect(() => {
    if (reduce) return undefined;
    const controls = animate(fold, 0.2, { duration: 1.1, delay: 0.35, ease: EASE });
    return () => controls.stop();
  }, [fold, reduce]);

  const peel = (to) => () => {
    if (!reduce) animate(fold, to, { duration: 0.5, ease: EASE });
  };

  return (
    <div className="-rotate-2">
      <motion.div className="relative" style={fit(ratio, 50, 60)} onHoverStart={peel(0.3)} onHoverEnd={peel(0.2)}>
        {/* Backing sheet, printed with its cutting grid */}
        <div
          className="absolute inset-0 rounded-[2px] bg-[#fbfbfb] shadow-[0_18px_30px_-16px_rgba(0,0,0,0.35)]"
          style={{
            backgroundImage: 'linear-gradient(rgba(110,130,165,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(110,130,165,0.2) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
        <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath: artClip }}>
          <Art src={src} />
        </motion.div>
        <div className="absolute inset-0 drop-shadow-[-3px_-3px_5px_rgba(0,0,0,0.25)]">
          <motion.div
            className="absolute inset-0"
            style={{ clipPath: flapClip, background: 'linear-gradient(315deg, #c4c4c4 0%, #ececec 45%, #ffffff 100%)' }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function Flat({ src, ratio, curl }) {
  return (
    <div className="relative shadow-[0_18px_30px_-16px_rgba(0,0,0,0.4)]" style={fit(ratio, 50, 60)}>
      <div className="absolute inset-0 overflow-hidden">
        <Art src={src} />
      </div>
      {curl && (
        <span aria-hidden="true" className="absolute bottom-0 right-0 size-1/4 bg-[linear-gradient(315deg,rgba(0,0,0,0.14),transparent_60%)]" />
      )}
    </div>
  );
}

export default function FinishMockup({ kind, src, ratio, flipped }) {
  return (
    <div className="grid place-items-center">
      {kind === 'stretched' && <Stretched src={src} ratio={ratio} flipped={flipped} />}
      {kind === 'rolled' && <Rolled src={src} ratio={ratio} />}
      {kind === 'softboard' && <SoftBoard src={src} ratio={ratio} />}
      {kind === 'sticker' && <Sticker src={src} ratio={ratio} />}
      {kind === 'paper' && <Flat src={src} ratio={ratio} curl />}
      {kind === 'generic' && <Flat src={src} ratio={ratio} />}
    </div>
  );
}
