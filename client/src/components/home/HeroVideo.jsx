import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import WebflowButton from '../ui/WebflowButton';
import storeEntryDesktop from '../../assets/videos/store-entry-desktop.mp4';
import storeEntryMobile from '../../assets/videos/store-entry-mobile.mp4';
import storeEntryPoster from '../../assets/videos/store-entry-poster.jpg';

/**
 * Scroll-driven store entrance.
 *
 * The section is taller than the viewport and its inner stage is `sticky`, so
 * the hero pins itself while the page scrolls past it. Scroll progress through
 * that extra height maps 1:1 onto the video timeline (25% scrolled === 25% of
 * the clip), so the visitor's scroll acts as the camera walking into the store.
 *
 * Two things make this smooth:
 *  - The source clip is re-encoded so EVERY frame is a keyframe. The original
 *    had 3 keyframes in 158 frames, which meant a seek had to decode up to 72
 *    frames and scrubbing stuttered badly.
 *  - Nothing here touches React state while scrolling. Progress is read and all
 *    visuals are written directly to the DOM inside one rAF loop; a re-render
 *    per scroll event would blow the frame budget on its own.
 */

// How much scrolling the pinned hero consumes, in viewport heights. The extra
// height beyond 1x is the actual scrub distance, so 3.4 => 2.4 screens of
// scrolling drives the clip start to finish.
const SCROLL_LENGTH_DESKTOP = 3.4;
const SCROLL_LENGTH_MOBILE = 2.6;

// How hard the eased time chases the scroll target, expressed per 60fps frame.
// Applied via a delta-time curve below so a 120Hz display eases at the same
// rate as a 60Hz one — a raw per-frame lerp converges twice as fast on 120Hz
// and makes the scrub feel different from machine to machine.
const SCRUB_EASE = 0.18;

// The clip is 24fps, so seeks are snapped to that grid. Without snapping we
// fire several seeks that all resolve to the same picture, and the redundant
// decodes are what make the scrub stutter.
const VIDEO_FPS = 24;
const FRAME_STEP = 1 / VIDEO_FPS;

// Fraction of the pin spent scrubbing. The remainder holds the last frame so
// the animation visibly finishes and rests before the section releases,
// instead of unpinning the instant the final frame lands.
const SCRUB_PORTION = 0.92;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// Hermite ramp — gives the fades an ease-in-out shape instead of a linear cut.
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// Pick the hero variant once, before anything downloads. Low-end phones and
// constrained connections get the still hero: scrubbing an all-keyframe clip
// means a full-frame decode on every seek, which those devices can't sustain,
// and the multi-MB download would dominate their first visit.
const detectMode = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static';

  const connection = navigator.connection;
  if (connection) {
    if (connection.saveData) return 'static';
    if (/(^|-)2g|3g/.test(connection.effectiveType || '')) return 'static';
  }
  // Both are Chromium-only hints; Safari leaves them undefined, so an absent
  // value never counts against the device.
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return 'static';
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return 'static';

  return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
};

// Run `callback` once the page has finished loading and the main thread is
// idle, so the clip never competes with the poster, fonts or JS chunks that
// make up first paint. Returns a cancel function.
const whenPageIdle = (callback) => {
  let idleId = 0;
  let timeoutId = 0;
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(callback, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(callback, 200);
    }
  };

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });

  return () => {
    window.removeEventListener('load', schedule);
    if (idleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
    if (timeoutId) window.clearTimeout(timeoutId);
  };
};

const HeroVideo = () => {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const glowRef = useRef(null);
  const cueRef = useRef(null);

  // Scrub bookkeeping lives in refs so the scroll loop never re-renders.
  const rafRef = useRef(0);
  const durationRef = useRef(0);
  const easedTimeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  // Object URL for the fully downloaded clip; null until the fetch completes.
  const [videoSrc, setVideoSrc] = useState(null);

  // Decided once on mount. Swapping the source on resize would restart the
  // download mid-scroll, which is worse than serving a phone the desktop clip.
  const [mode] = useState(detectMode);

  // `svh` ignores the mobile URL bar, so the pinned stage does not resize (and
  // visibly jump) as the browser chrome collapses. Resolved once, with a vh
  // fallback for browsers that predate the unit.
  const [unit] = useState(() => {
    if (typeof CSS === 'undefined' || !CSS.supports) return 'vh';
    return CSS.supports('height', '100svh') ? 'svh' : 'vh';
  });

  const isStatic = mode === 'static' || hasFailed;
  const scrollLength = mode === 'mobile' ? SCROLL_LENGTH_MOBILE : SCROLL_LENGTH_DESKTOP;

  // Falling back to the still hero collapses the tall pinned section, which
  // would yank the page if the visitor has already scrolled into it. Only
  // swap layouts while they are still at the top; otherwise the poster simply
  // stays pinned in place of the clip.
  const failGracefully = () => {
    if (window.scrollY < window.innerHeight * 0.25) setHasFailed(true);
  };

  // Download the whole clip up front instead of streaming it into <video>.
  //  - Mobile Safari and data-saver modes ignore preload="auto" and may never
  //    fetch a muted, never-played video, which left the hero stuck forever.
  //  - A streamed clip turns every seek past the buffered range into a network
  //    round trip, so scrubbing stalled. From a Blob every seek is local.
  useEffect(() => {
    if (isStatic) return undefined;

    const controller = new AbortController();
    let objectUrl = null;

    const cancelIdle = whenPageIdle(async () => {
      try {
        const response = await fetch(mode === 'mobile' ? storeEntryMobile : storeEntryDesktop, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);
      } catch (err) {
        if (err.name !== 'AbortError') failGracefully();
      }
    });

    return () => {
      cancelIdle();
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isStatic, mode]);

  useEffect(() => {
    if (isStatic) return undefined;

    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return undefined;

    let cancelled = false;

    const handleMetadata = () => {
      durationRef.current = video.duration || 0;
      // Safari (and iOS in particular) will not paint or reliably honour a seek
      // until the element has decoded once. A muted play immediately followed
      // by a pause primes the decoder without the visitor seeing playback.
      const played = video.play();
      if (played && typeof played.then === 'function') {
        played
          .then(() => {
            video.pause();
            video.currentTime = 0;
          })
          .catch(() => {
            // Autoplay refused. Seeking still works once buffered, so the
            // scrub degrades gracefully rather than breaking.
          });
      }
    };

    // The poster stays on top until a real frame is decoded, so the swap from
    // still to video is invisible.
    const handleLoadedData = () => setIsReady(true);
    const handleError = () => failGracefully();

    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    if (video.readyState >= 1) handleMetadata();
    if (video.readyState >= 2) handleLoadedData();

    const applyVisuals = (progress) => {
      // Camera push: starts slightly ahead of the doorway and settles level as
      // the store fills the frame, then drifts a touch closer on the way out.
      const settle = smoothstep(0, 0.65, progress);
      const exit = smoothstep(0.72, 1, progress);
      const depth = mode === 'mobile' ? 0 : 1;

      const stage = stageRef.current;
      if (stage) {
        const scale = 1.1 - 0.1 * settle + 0.05 * exit;
        const z = -70 + 70 * settle;
        const rotateX = depth * 1.6 * (1 - settle);
        stage.style.transform =
          `perspective(1500px) translate3d(0, ${depth * -14 * (1 - settle)}px, ${z}px) ` +
          `rotateX(${rotateX}deg) scale(${scale})`;
      }

      // Hero copy clears out early so it never covers the doorway.
      const content = contentRef.current;
      if (content) {
        const out = smoothstep(0.02, 0.3, progress);
        content.style.opacity = String(1 - out);
        content.style.transform = `translate3d(0, ${-64 * out}px, 0) scale(${1 - 0.05 * out})`;
        content.style.pointerEvents = out > 0.5 ? 'none' : 'auto';
      }

      const cue = cueRef.current;
      if (cue) cue.style.opacity = String(1 - smoothstep(0, 0.12, progress));

      // Warm interior light blooms as the camera crosses the threshold.
      const glow = glowRef.current;
      if (glow) {
        glow.style.opacity = String(0.55 * smoothstep(0.25, 0.8, progress) * (1 - exit * 0.5));
      }

    };

    const frame = (now) => {
      if (cancelled) return;

      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - window.innerHeight;
      const progress = travel > 0 ? clamp(-rect.top / travel) : 0;

      // Camera move and copy fade run from the first frame, so the hero feels
      // alive on the poster while the clip is still downloading.
      applyVisuals(progress);

      const duration = durationRef.current;
      if (duration > 0) {
        // Position -> time. Deliberately not velocity based: the same scroll
        // offset always resolves to the same frame, scrubbed either direction.
        // The scrub finishes at SCRUB_PORTION so the tail of the pin holds the
        // last frame rather than releasing the moment it arrives.
        const target = clamp(progress / SCRUB_PORTION) * duration;

        // Frame-rate independent easing. Raising (1 - ease) to the elapsed
        // frame count keeps the response identical at 60Hz and 120Hz.
        const prev = lastTimeRef.current || now;
        const deltaFrames = clamp((now - prev) / (1000 / 60), 0, 4);
        lastTimeRef.current = now;
        const alpha = 1 - Math.pow(1 - SCRUB_EASE, deltaFrames);

        let eased = easedTimeRef.current + (target - easedTimeRef.current) * alpha;
        if (Math.abs(target - eased) < 0.004) eased = target; // settle exactly
        easedTimeRef.current = eased;

        // Snap to the clip's own frame grid, then only seek when that lands on
        // a different frame than the one already shown. Seeking to sub-frame
        // offsets just re-decodes the same picture and is what stutters.
        const snapped = Math.min(
          duration,
          Math.round(eased / FRAME_STEP) * FRAME_STEP
        );
        if (
          video.readyState >= 2 &&
          !video.seeking &&
          Math.abs(video.currentTime - snapped) >= FRAME_STEP * 0.5
        ) {
          video.currentTime = snapped;
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    // Only loop while the hero is on screen and the tab is visible. Once the
    // visitor scrolls past it, the rest of the page shouldn't pay for a
    // per-frame layout read, which matters most on weaker phones.
    let onScreen = true;
    const start = () => {
      cancelAnimationFrame(rafRef.current);
      if (cancelled || !onScreen || document.visibilityState !== 'visible') return;
      // Drop the stale timestamp so the first frame back doesn't see the
      // whole paused period as one enormous delta.
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      start();
    });
    observer.observe(section);
    start();

    document.addEventListener('visibilitychange', start);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [isStatic, mode]);

  const heroCopy = (
    <>
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-accent font-body text-sm md:text-base tracking-[0.3em] uppercase mb-4"
      >
        Luxury Home Décor
      </motion.span>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white max-w-4xl leading-tight"
      >
        Right to <span className="text-accent">luxury</span>
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="text-white/70 text-lg md:text-xl max-w-2xl mt-6 font-body"
      >
        A Canvas for your soul &amp; A Nameplate for Aapki Pehchaan
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="mt-10 items-center flex flex-col sm:flex-row gap-4"
      >
        <WebflowButton to="/canvas" className="text-lg">
          Canvas
        </WebflowButton>
        <Link
          to="/house-nameplates"
          className="btn-outline border-white text-white hover:bg-white hover:text-secondary text-lg px-10 py-4"
        >
          Custom Nameplates
        </Link>
      </motion.div>
    </>
  );

  // Reduced motion, or the video failed to load: keep the same framing and copy
  // as a still, so the section still reads as the store entrance.
  if (isStatic) {
    return (
      <section className="relative w-full overflow-hidden flex flex-col items-center justify-center py-32" style={{ minHeight: `100${unit}` }}>
        <img
          src={storeEntryPoster}
          alt="Entrance to the GPSFDK store — premium wall canvas prints and custom house nameplates"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full text-center px-4">
          {heroCopy}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{ height: `${scrollLength * 100}${unit}` }}
      className="relative w-full"
      aria-label="Entering the GPSFDK store"
    >
      <div
        className="sticky top-0 w-full overflow-hidden bg-black"
        style={{ height: `100${unit}` }}
      >
        {/* Video stage — transformed as a whole so the picture, not the text,
            carries the camera movement. */}
        <div
          ref={stageRef}
          className="absolute inset-0 will-change-transform"
          style={{ transform: 'perspective(1500px) scale(1.1)' }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={videoSrc || undefined}
            preload="auto"
            muted
            playsInline
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
          />
          {/* The poster is the first frame of the clip, so it stands in until a
              real frame is decoded, then fades out. The hero is fully usable
              meanwhile; there is no blocking loader. */}
          <img
            src={storeEntryPoster}
            alt=""
            fetchPriority="high"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isReady ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>

        {/* Depth: darkened edges keep the eye on the doorway. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 100%)' }}
        />

        {/* Warm interior light, revealed as the camera crosses the threshold. */}
        <div
          ref={glowRef}
          className="absolute inset-0 pointer-events-none opacity-0"
          style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(241,90,41,0.22) 0%, transparent 60%)' }}
        />

        {/* Legibility scrim for the copy. */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/55 via-black/25 to-black/65" />

        <div
          ref={contentRef}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full text-center px-4 will-change-transform"
        >
          {heroCopy}
        </div>

        <motion.div
          ref={cueRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 z-20 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-3 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroVideo;
