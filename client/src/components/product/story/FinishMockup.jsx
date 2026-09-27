import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { handleImageError } from '../../../utils/imageOptimizer';

/* ── Finish mockups ───────────────────────────────────────────────────────────
   Each finish as a small 3D model, drawn with the product's own artwork at the
   proportions of the selected size, turned by the explorer's turntable
   (rotateX/rotateY motion values). Every model has a front and a back — a
   stretched canvas shows its wooden stretcher bars, a sticker its printed
   backing grid — and edges where it has a thickness. Faces darken as they
   turn away from the viewer.

   They render inside the explorer's stage, which is a size container: cqw
   and cqh keep every model inside it at any width. */

// As large as fits both ways inside the stage
const fit = (ratio, maxW, maxH) => ({ width: `min(${maxW}cqw, calc(${maxH}cqh * ${ratio}))`, aspectRatio: `${ratio}` });

// Unprinted canvas: a fine linen weave
const LINEN =
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 3px)';

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
      className="pointer-events-none absolute inset-0 size-full select-none object-cover"
    />
  );
}

// How dark a face is: none square-on, more as it turns away. `phase` is the
// face's own heading: 0 front, 180 back, 90 right edge, -90 left edge.
function useShade(rotateY, phase, strength = 0.55) {
  return useTransform(rotateY, (y) => {
    const facing = Math.cos(((y + phase) * Math.PI) / 180);
    return Math.min(0.7, Math.max(0, (1 - facing) * strength));
  });
}

// `reveal` is motion props for the whole face, shade included (the rolled
// canvas unrolls with a clip-path)
function Face({ shade, style, reveal, children }) {
  return (
    <motion.div className="absolute inset-0 overflow-hidden [backface-visibility:hidden]" style={style} {...reveal}>
      {children}
      <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: shade }} />
    </motion.div>
  );
}

// Where each edge face sits, hinged back from the front's edge, and which
// strip of the print wraps round it
const EDGES = {
  right: { className: 'left-full top-0 h-full origin-left', transform: 'rotateY(90deg)', size: 'width', strip: 'right center / auto 100%', phase: 90 },
  left: { className: 'right-full top-0 h-full origin-right', transform: 'rotateY(-90deg)', size: 'width', strip: 'left center / auto 100%', phase: -90 },
  top: { className: 'bottom-full left-0 w-full origin-bottom', transform: 'rotateX(90deg)', size: 'height', strip: 'center top / 100% auto' },
  bottom: { className: 'left-0 top-full w-full origin-top', transform: 'rotateX(-90deg)', size: 'height', strip: 'center bottom / 100% auto' },
};

function Edge({ side, depth, background, rotateY }) {
  const edge = EDGES[side];
  const shade = useShade(rotateY, edge.phase ?? 0, edge.phase === undefined ? 0 : 0.45);
  return (
    <div
      aria-hidden="true"
      className={`absolute overflow-hidden [backface-visibility:hidden] ${edge.className}`}
      style={{ [edge.size]: depth, transform: edge.transform, background: background(edge.strip, side) }}
    >
      {/* The top catches the light, the bottom sits in shadow */}
      {side === 'bottom' && <span className="absolute inset-0 bg-black/35" />}
      {side === 'top' && <span className="absolute inset-0 bg-white/15" />}
      {edge.phase !== undefined && <motion.span className="absolute inset-0 bg-black" style={{ opacity: shade }} />}
    </div>
  );
}

/* A block with a front, a back `depth` px behind it and, if `edge` is given,
   four edges. Extra 3D parts (the roll of a rolled canvas) go in `children`. */
function Solid({ ratio, depth, rotateX, rotateY, front, back, edge, reveal, children, maxW = 54, maxH = 60 }) {
  const frontShade = useShade(rotateY, 0);
  const backShade = useShade(rotateY, 180);
  // A soft highlight that slides across the print as it turns
  const sheenX = useTransform(rotateY, (y) => `${50 - y * 1.4}%`);
  return (
    <div className="relative" style={fit(ratio, maxW, maxH)}>
      {/* Its shadow on the wall behind, which stays put as it turns */}
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-[7%] left-1/2 h-[9%] w-[78%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-xl" />
      <div className="absolute inset-0" style={{ perspective: 1400 }}>
        <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
          <Face shade={frontShade} reveal={reveal}>
            {front}
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.2)_48%,transparent_62%)] bg-[length:250%_100%] mix-blend-screen"
              style={{ backgroundPositionX: sheenX }}
            />
          </Face>
          <Face shade={backShade} reveal={reveal} style={{ transform: `translateZ(-${depth}px) rotateY(180deg)` }}>
            {back}
          </Face>
          {edge && ['right', 'left', 'top', 'bottom'].map((side) => (
            <Edge key={side} side={side} depth={depth} background={edge} rotateY={rotateY} />
          ))}
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// An edge face showing the strip of print that wraps round it, shaded
const wrapped = (src) => (strip) =>
  src ? `url("${src}") ${strip} no-repeat, #1a1a1a` : '#e6dfd0';

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

function Stretched({ src, ratio, rotateX, rotateY }) {
  return (
    <Solid
      ratio={ratio}
      depth={16}
      rotateX={rotateX}
      rotateY={rotateY}
      front={<Art src={src} />}
      back={<StretcherBack />}
      edge={wrapped(src)}
    />
  );
}

function SoftBoard({ src, ratio, rotateX, rotateY }) {
  return (
    <Solid
      ratio={ratio}
      depth={9}
      rotateX={rotateX}
      rotateY={rotateY}
      front={<Art src={src} />}
      // Sunboard is white foam right through
      back={<div className="absolute inset-0 bg-[linear-gradient(160deg,#fafaf7,#e9e9e3)]" />}
      edge={() => 'linear-gradient(90deg, #ffffff, #e2e2dc)'}
    />
  );
}

function Paper({ src, ratio, rotateX, rotateY }) {
  return (
    <Solid
      ratio={ratio}
      depth={1}
      rotateX={rotateX}
      rotateY={rotateY}
      maxW={50}
      front={(
        <>
          <Art src={src} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 size-1/4 bg-[linear-gradient(315deg,rgba(0,0,0,0.14),transparent_60%)]" />
        </>
      )}
      back={<div className="absolute inset-0 bg-[#f6f4ee]" style={{ backgroundImage: LINEN }} />}
    />
  );
}

// The sticker's front: the print with one corner peeled back off its liner
function PeelingSticker({ src, ratio }) {
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
    <motion.div className="absolute inset-0" onHoverStart={peel(0.3)} onHoverEnd={peel(0.2)}>
      {/* The liner under the peeled corner: glossy and plain */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff,#f1f1ef)]" />
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
  );
}

function Sticker({ src, ratio, rotateX, rotateY }) {
  return (
    <Solid
      ratio={ratio}
      depth={1.5}
      rotateX={rotateX}
      rotateY={rotateY}
      maxW={50}
      front={<PeelingSticker src={src} ratio={ratio} />}
      // The back of the liner, printed with its cutting grid
      back={(
        <div
          className="absolute inset-0 bg-[#fbfbfb]"
          style={{
            backgroundImage: 'linear-gradient(rgba(110,130,165,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(110,130,165,0.22) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
      )}
    />
  );
}

/* A roll of canvas: a cylinder of facets round the horizontal axis, lit from
   above, with spiral end caps. Its radius is in cqh so it scales with the stage. */
const ROLL_FACETS = 14;
const ROLL_R = 2.6; // cqh
const FACET = 2 * ROLL_R * Math.tan(Math.PI / ROLL_FACETS) + 0.08; // a hair wide, so no seams show

const facetColor = (index) => {
  const angle = (index / ROLL_FACETS) * 2 * Math.PI;
  // Light from above and in front
  const light = Math.max(0, 0.6 * Math.sin(angle) + 0.8 * Math.cos(angle));
  const tone = Math.round(150 + light * 102);
  return `rgb(${tone}, ${tone - 3}, ${tone - 10})`;
};

function Roll({ open, unroll, reduce }) {
  const cap = 'absolute rounded-full [backface-visibility:hidden] bg-[radial-gradient(circle,#4a463f_0_16%,transparent_17%),repeating-radial-gradient(circle,#efe9dc_0_5%,#cfc6b3_5%_7%)]';
  return (
    <motion.div
      aria-hidden="true"
      className="absolute -left-[2.5%] -right-[2.5%] h-0"
      style={{ transformStyle: 'preserve-3d' }}
      initial={reduce ? false : { top: '6%' }}
      animate={{ top: `${open}%` }}
      transition={unroll}
    >
      {Array.from({ length: ROLL_FACETS }, (_, index) => (
        <span
          key={index}
          className="absolute inset-x-0 [backface-visibility:hidden]"
          style={{
            height: `${FACET}cqh`,
            top: `${-FACET / 2}cqh`,
            transform: `rotateX(${(360 / ROLL_FACETS) * index}deg) translateZ(${ROLL_R}cqh)`,
            background: facetColor(index),
          }}
        />
      ))}
      <span className={cap} style={{ width: `${2 * ROLL_R}cqh`, height: `${2 * ROLL_R}cqh`, left: `${-ROLL_R}cqh`, top: `${-ROLL_R}cqh`, transform: 'rotateY(-90deg)' }} />
      <span className={cap} style={{ width: `${2 * ROLL_R}cqh`, height: `${2 * ROLL_R}cqh`, left: `calc(100% - ${ROLL_R}cqh)`, top: `${-ROLL_R}cqh`, transform: 'rotateY(90deg)' }} />
    </motion.div>
  );
}

function Rolled({ src, ratio, rotateX, rotateY }) {
  const reduce = useReducedMotion();
  const open = 86; // how far down it's unrolled, in %
  const unroll = { duration: 1.3, ease: EASE, delay: 0.15 };
  return (
    <Solid
      ratio={ratio}
      depth={0.5}
      rotateX={rotateX}
      rotateY={rotateY}
      maxW={52}
      maxH={56}
      // Both sides of the sheet unroll together
      reveal={{
        initial: reduce ? false : { clipPath: 'inset(0% 0% 94% 0%)' },
        animate: { clipPath: `inset(0% 0% ${100 - open}% 0%)` },
        transition: unroll,
      }}
      front={<Art src={src} />}
      back={<div className="absolute inset-0 bg-[#ece3d1]" style={{ backgroundImage: LINEN }} />}
    >
      <Roll open={open} unroll={unroll} reduce={reduce} />
    </Solid>
  );
}

export default function FinishMockup({ kind, src, ratio, rotateX, rotateY }) {
  const Model = {
    stretched: Stretched,
    rolled: Rolled,
    softboard: SoftBoard,
    sticker: Sticker,
    paper: Paper,
  }[kind] || Paper;
  return <Model src={src} ratio={ratio} rotateX={rotateX} rotateY={rotateY} />;
}
