import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  animate, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform,
} from 'framer-motion';
import { LuArrowUpRight } from 'react-icons/lu';
import { collectionPath } from '../../../utils/collections';
import { handleImageError } from '../../../utils/imageOptimizer';

/* ── The piece ────────────────────────────────────────────────────────────────
   Opens the story like a gallery room: the artwork hangs as a stretched canvas
   under a brass picture light on a museum-green wall, with a gallery label
   beside it. With a mouse, the canvas turns towards the pointer and the pool
   of light follows it. Products without a separate artwork image (nameplates,
   and canvases uploaded with only the room shot) show their lifestyle photo
   as a framed print instead. */

const SPRING = { stiffness: 110, damping: 20, mass: 0.7 };

// Paint grain for the wall: a tile of SVG turbulence
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const BRASS = 'linear-gradient(135deg, #b4863a 0%, #f0d38c 28%, #d2a95a 50%, #f5e1a4 70%, #a47830 100%)';
const SCREW = 'radial-gradient(circle at 35% 35%, #fff4d2, #a37b36 58%, #5a4015)';

// Extreme panoramas and tall strips would swamp the column
const clampRatio = (ratio) => Math.min(2.1, Math.max(0.62, ratio || 1.5));

const withStop = (name) => (/[.!?]$/.test(name) ? name : `${name}.`);

function CountUp({ value }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  // Starts at the real figure, so crawlers and reduced-motion visitors read it
  // as is; it only counts up for someone scrolling it into view.
  const count = useMotionValue(value);
  const rounded = useTransform(count, (v) => Math.round(v));
  const inView = useInView(ref, { once: true, margin: '0px 0px 20% 0px' });

  useEffect(() => {
    if (!inView || reduce) return undefined;
    count.set(0);
    const controls = animate(count, value, { duration: 1.3, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function PictureLight() {
  return (
    <div aria-hidden="true" className="relative z-20 -mb-2 flex flex-col items-center">
      <span className="h-6 w-[3px] bg-gradient-to-b from-[#8c6a2f] to-[#d6b26a]" />
      <span className="relative h-4 w-44 rounded-b-[10px] rounded-t-[3px] bg-[linear-gradient(180deg,#f8e6b0,#c8994a_55%,#77561f)] shadow-[0_8px_16px_rgba(0,0,0,0.55)] sm:w-52">
        {/* The bulb's glow on the underside of the hood */}
        <span className="absolute inset-x-3 -bottom-1 h-2 rounded-full bg-[#fff1cf] blur-[3px]" />
      </span>
    </div>
  );
}

function HungCanvas({ src, ratio, alt, rotateX, rotateY, glare }) {
  const r = clampRatio(ratio);
  const depth = 16;
  return (
    <div className="relative flex flex-col items-center">
      {/* The lamp's light on the wall behind the top of the canvas */}
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-2 -z-10 h-56 w-[36rem] max-w-[120%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,224,168,0.3),transparent)] blur-md" />
      <PictureLight />
      <div className="relative w-full" style={{ perspective: 1600 }}>
        <motion.div
          className="relative mx-auto"
          style={{ width: `min(100%, 34rem, calc(28rem * ${r}))`, aspectRatio: r, rotateX, rotateY, transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 overflow-hidden bg-[#111] shadow-[0_50px_80px_-40px_rgba(0,0,0,0.9)]">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={handleImageError}
              className="size-full object-cover"
            />
            {/* The lamp's cone of light on the print, and a sheen that follows the pointer */}
            <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_0%,rgba(255,236,200,0.26),transparent_75%)] mix-blend-screen" />
            <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(0,0,0,0.18))]" />
            <motion.span aria-hidden="true" className="absolute inset-0 mix-blend-soft-light" style={{ background: glare }} />
          </div>
          {/* Gallery-wrapped edges: the print carries on round the frame. The
              faces hinge back from the front's right and bottom edges. */}
          <span
            aria-hidden="true"
            className="absolute left-full top-0 h-full origin-left"
            style={{
              width: depth,
              transform: 'rotateY(90deg)',
              background: `linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0.55)), url("${src}") right center / auto 100% no-repeat`,
            }}
          />
          <span
            aria-hidden="true"
            className="absolute left-0 top-full w-full origin-top"
            style={{
              height: depth,
              transform: 'rotateX(-90deg)',
              background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url("${src}") center bottom / 100% auto no-repeat`,
            }}
          />
        </motion.div>
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-1/2 -z-10 h-16 w-[62%] -translate-x-1/2 rounded-[50%] bg-black/60 blur-2xl" />
      </div>
    </div>
  );
}

function FramedPhoto({ src, alt, rotateX, rotateY, glare }) {
  return (
    <div className="relative" style={{ perspective: 1600 }}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-[10%] rounded-full bg-[#f5c97a]/20 blur-[90px]" />
      <motion.figure
        className="relative overflow-hidden rounded-[26px] shadow-[0_60px_110px_-40px_rgba(0,0,0,0.95)] ring-1 ring-white/10"
        style={{ rotateX, rotateY }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={handleImageError}
          className="block aspect-[4/3] w-full object-cover"
        />
        <motion.span aria-hidden="true" className="absolute inset-0 mix-blend-soft-light" style={{ background: glare }} />
      </motion.figure>
    </div>
  );
}

// The card beside a canvas, set like a gallery's wall label
function MuseumLabel({ title, subtitle, lines }) {
  return (
    <div className="mt-10 max-w-[340px] rounded-[3px] bg-[#f6f1e6] px-5 py-4 text-[#1d1d1f] shadow-[0_24px_40px_-24px_rgba(0,0,0,0.85)]">
      <p className="text-[15px] font-semibold leading-snug">{title}</p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-[#6e6e73]">{subtitle}</p>
      <div className="my-3 h-px bg-black/10" />
      {lines.map((line) => (
        <p key={line} className="text-[12.5px] leading-[1.6] text-[#3a3a3c]">{line}</p>
      ))}
    </div>
  );
}

// A nameplate's label is a little brass plaque, screws and all
function BrassPlaque({ title, subtitle, lines }) {
  return (
    <div
      className="relative mt-10 max-w-[360px] rounded-[10px] px-7 py-5 text-[#3d2a0c]"
      style={{
        background: BRASS,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 5px rgba(0,0,0,0.25), 0 26px 44px -22px rgba(0,0,0,0.85)',
      }}
    >
      {['left-2.5 top-2.5', 'right-2.5 top-2.5', 'bottom-2.5 left-2.5', 'bottom-2.5 right-2.5'].map((position) => (
        <span key={position} aria-hidden="true" className={`absolute ${position} size-2 rounded-full`} style={{ background: SCREW }} />
      ))}
      <p className="text-[15px] font-semibold uppercase leading-snug tracking-[0.12em]">{title}</p>
      <p className="mt-1 text-[12.5px] text-[#5c4318]">{subtitle}</p>
      <div className="my-3 h-px bg-[#5c4318]/25" />
      {lines.map((line) => (
        <p key={line} className="text-[12.5px] leading-[1.6]">{line}</p>
      ))}
    </div>
  );
}

export default function GalleryHero({ product, kind, art, artRatio, photo, headline, lead, leadHtml, label, stats, collection }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // The canvas rests almost square-on to the wall (a hair turned, so a sliver
  // of its wrapped edge shows) and turns further as the pointer moves.
  const canvasRotateY = useSpring(useTransform(px, [-0.5, 0.5], [-11, 4]), SPRING);
  const canvasRotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -1]), SPRING);
  const photoRotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), SPRING);
  const photoRotateX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), SPRING);
  const glareX = useTransform(px, [-0.5, 0.5], ['10%', '90%']);
  const glareY = useTransform(py, [-0.5, 0.5], ['5%', '95%']);
  const glare = useMotionTemplate`radial-gradient(55% 45% at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 70%)`;
  const lightX = useSpring(useTransform(px, (v) => v * 240), SPRING);
  const lightY = useSpring(useTransform(py, (v) => v * 160), SPRING);

  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - box.left) / box.width - 0.5);
    py.set((e.clientY - box.top) / box.height - 0.5);
  };
  const onPointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  const hangCanvas = kind !== 'nameplate' && art.url && !art.cropped;
  const eyebrow = kind === 'nameplate' ? 'House nameplate' : product.category?.name || 'GPSFDK';

  return (
    <section
      aria-labelledby="story-title"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate overflow-hidden bg-[#0f3a27] text-white"
    >
      {/* Wall: museum green, a pool of warm light that follows the pointer, paint grain and a vignette */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_30%_35%,#1a5439_0%,#0f3a27_55%,#0a2a1c_100%)]" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[calc(50%-550px)] top-[calc(22%-550px)] -z-10 size-[1100px] rounded-full md:left-[calc(33%-550px)] md:top-[calc(46%-550px)]"
        style={{ x: lightX, y: lightY, background: 'radial-gradient(closest-side, rgba(255,214,150,0.2), rgba(255,214,150,0.06) 55%, transparent)' }}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.09] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_85%_at_50%_40%,transparent_55%,rgba(0,0,0,0.35))]" />

      <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 pb-16 pt-20 sm:px-8 md:grid-cols-12 md:gap-10 md:pb-20 md:pt-28 lg:gap-16">
        <motion.div
          className="md:col-span-7"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {hangCanvas ? (
            <HungCanvas
              src={art.url}
              ratio={artRatio}
              alt={`${product.name}, the artwork`}
              rotateX={canvasRotateX}
              rotateY={canvasRotateY}
              glare={glare}
            />
          ) : photo ? (
            <FramedPhoto src={photo} alt={product.name} rotateX={photoRotateX} rotateY={photoRotateY} glare={glare} />
          ) : null}
        </motion.div>

        <motion.div
          className="md:col-span-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {collection ? (
            <Link
              to={collectionPath(collection)}
              className="apple-eyebrow group inline-flex items-center gap-2 uppercase text-[#f3c98b] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0f3a27]"
            >
              <span aria-hidden="true" className="h-px w-6 bg-current" />
              {collection} collection
              <LuArrowUpRight aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <p className="apple-eyebrow inline-flex items-center gap-2 uppercase text-[#f3c98b]">
              <span aria-hidden="true" className="h-px w-6 bg-current" />
              {eyebrow}
            </p>
          )}

          <h2 id="story-title" className="mt-5 text-[38px] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[46px] lg:text-[52px]">
            <span className="block text-white">{withStop(product.name)}</span>
            <span className="block text-balance text-white/45">{headline}</span>
          </h2>

          {leadHtml ? (
            <div className="story-rich mt-6 text-[17px] leading-[1.6] text-white/75" dangerouslySetInnerHTML={{ __html: leadHtml }} />
          ) : (
            <p className="mt-6 text-[17px] leading-[1.6] text-white/75">{lead}</p>
          )}

          {kind === 'nameplate' ? <BrassPlaque {...label} /> : <MuseumLabel {...label} />}
        </motion.div>
      </div>

      {stats.length > 0 && (
        <div className="border-t border-white/10">
          <dl className={`mx-auto grid max-w-[1200px] grid-cols-2 px-5 sm:px-8 ${stats.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            {stats.map((stat, index) => (
              <div
                key={stat.unit}
                className={`flex flex-col-reverse justify-end gap-1.5 border-white/10 py-8 md:py-10 ${index > 0 ? 'md:border-l md:pl-8' : ''} ${index % 2 === 1 ? 'border-l pl-5' : ''} ${index >= 2 ? 'border-t md:border-t-0' : ''}`}
              >
                <dt className="text-[13px] leading-snug text-white/55">{stat.label}</dt>
                <dd className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-[34px] font-semibold leading-none tracking-[-0.03em] sm:text-[44px]">
                    {typeof stat.value === 'number' ? <CountUp value={stat.value} /> : stat.value}
                  </span>
                  <span className="text-[15px] font-medium text-[#f3c98b]">{stat.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
