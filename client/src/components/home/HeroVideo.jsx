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
 * that extra height maps 1:1 onto the walk-in (25% scrolled === 25% of the
 * clip), so the visitor's scroll acts as the camera walking into the store.
 *
 * Built to work on slow connections:
 *  - A light flip-book of 40 stills (every 4th frame) drives the scrub first:
 *    640x360 on desktop (~1.1 MB in all), a 360x640 centre crop on phones
 *    (~0.9 MB); the sharp poster replaces the first once it loads. They load
 *    coarse to fine — the two ends, then the middle, then the middles of each half — so
 *    the first handful (~130 KB) already span the whole walk-in, and
 *    neighbouring stills are cross-faded, so it plays smoothly while the rest
 *    fill in.
 *  - The full video downloads behind them and takes over, seamlessly and on
 *    the same frame, once it is decoded. On slow connections, data saver or
 *    weak devices the video is skipped entirely and the stills are the hero.
 *
 * The video scrub is smooth because the clip is re-encoded so EVERY frame is a
 * keyframe (the original had 3 in 158 frames, so each seek decoded up to 72).
 * Nothing here touches React state while scrolling: progress is read and all
 * visuals are written directly to the DOM inside one rAF loop.
 */

// How much scrolling the pinned hero consumes, in viewport heights. The extra
// height beyond 1x is the actual scrub distance, so 3.4 => 2.4 screens of
// scrolling drives the walk-in start to finish.
const SCROLL_LENGTH_DESKTOP = 3.4;
const SCROLL_LENGTH_MOBILE = 2.6;

// How hard the eased position chases the scroll target, expressed per 60fps
// frame. Applied via a delta-time curve below so a 120Hz display eases at the
// same rate as a 60Hz one.
const SCRUB_EASE = 0.18;

// The clip is 24fps, so video seeks are snapped to that grid. Without snapping
// we fire several seeks that all resolve to the same picture, and the
// redundant decodes are what make the scrub stutter.
const VIDEO_FPS = 24;
const FRAME_STEP = 1 / VIDEO_FPS;

// Fraction of the pin spent scrubbing. The remainder holds the last frame so
// the animation visibly finishes and rests before the section releases.
const SCRUB_PORTION = 0.92;

// The flip-book stills, in clip order (frame-000 … frame-039): landscape for
// desktop, and the centre of the frame in portrait for phones, where cover
// crops a landscape still to a sliver and stretches it. frame-000 is small, so
// on a slow line it shows the storefront well before the full poster arrives.
const urlsInOrder = (modules) => Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);
const STILLS_LANDSCAPE = urlsInOrder(
  import.meta.glob('../../assets/hero-frames/frame-*.jpg', { eager: true, query: '?url', import: 'default' })
);
const STILLS_PORTRAIT = urlsInOrder(
  import.meta.glob('../../assets/hero-frames-portrait/frame-*.jpg', { eager: true, query: '?url', import: 'default' })
);

// A 48px copy of the poster (~1 KB), inlined so the stage shows the
// storefront, blurred, from the very first paint instead of black while the
// full poster downloads.
const POSTER_PREVIEW = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAMKADAAQAAAABAAAAGwAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgAGwAwAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMABgYGBgYGCgYGCg4KCgoOEg4ODg4SFxISEhISFxwXFxcXFxccHBwcHBwcHCIiIiIiIicnJycnLCwsLCwsLCwsLP/bAEMBBwcHCwoLEwoKEy4fGh8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLv/dAAQAA//aAAwDAQACEQMRAD8A8kj1vUHUFQM56cf4VPF4j1BflYAYPPQ8j8K6PxJb29lpfm20xbdL93sR/Cfy/lTfDS2RskkvQPnMhU46HJ44IOT0FY8yceY15XzcpJpfiMSQb7q7jgfdjaYt5+pOOlLqviRUtvMtLyOeQtjYIthxzznGPwq5DbMPNIKriUDcWI6ru5UfT1qRopJTCJXRSZAMg5IB4Jxjpg1neNzTllY4w+ItRZd3yhsjA4/wqCTXNQXPmbR+X+Fdp4mitodJlNvIWKSR7t23dwwA6AcVn+HrDTdQsDPqLygBiB5QBIOflyD2J4rVNWujJp3sz//Q4nxOIpNKVIQm/evyIMkAZxjirXhdLeLTYhcxkupcjdlcZYkdq1LlisHy9sUkMknlKdx79/c1jy+7Y1UveuTW9rHJ58yRZJkYgknAG3GRnrxVe4tJY4oCwJ2tweDxwcnFX9zeU5ychh/6DUSu4wQT1qOR3LctDlb43kvhmRLoO9w0gySDuKhgegHTrVXRpbm105PJwjh2J6bvbIP1OK7J2ZLH5SetVUdntgW5OT2rTl0I5tbn/9k=';

// Neighbouring stills are cross-faded; across a wider gap (only while few
// have loaded) the nearest is shown instead of a double exposure.
const MAX_CROSSFADE_GAP = 3;

// Stills loaded before the video download starts, so on a slow line the
// walk-in works first and the big file waits its turn
const STILLS_BEFORE_VIDEO = 9;
// …but never wait longer than this for them
const VIDEO_START_FALLBACK_MS = 3000;
const PARALLEL_STILL_LOADS = 4;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// Hermite ramp — gives the fades an ease-in-out shape instead of a linear cut.
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// Load order for `count` stills: both ends, then repeatedly the middle of
// every gap, so each still fetched halves the largest remaining jump.
const coarseToFine = (count) => {
  const order = [0, count - 1];
  let gaps = [[0, count - 1]];
  while (gaps.length) {
    const next = [];
    for (const [a, b] of gaps) {
      if (b - a < 2) continue;
      const mid = Math.floor((a + b) / 2);
      order.push(mid);
      next.push([a, mid], [mid, b]);
    }
    gaps = next;
  }
  return order;
};

// Decide the hero once, before anything downloads.
//  - Reduced motion: the still hero, no scroll animation.
//  - Slow connection, data saver or a weak device: the flip-book only — it is
//    light to download and cheap to draw, where scrubbing an all-keyframe
//    video means a full-frame decode on every seek.
//  - Otherwise: the flip-book first, then the video for the phone or desktop.
const detectHero = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return { mode: 'desktop', withVideo: true };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { mode: 'static', withVideo: false };

  const mode = window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
  const connection = navigator.connection;
  const slowLine = Boolean(connection && (connection.saveData || /(^|-)2g|3g/.test(connection.effectiveType || '')));
  // Both are Chromium-only hints; Safari leaves them undefined, so an absent
  // value never counts against the device.
  const weakDevice = Boolean(
    (navigator.deviceMemory && navigator.deviceMemory < 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
  );
  return { mode, withVideo: !slowLine && !weakDevice };
};

const HeroVideo = () => {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const posterRef = useRef(null);
  const contentRef = useRef(null);
  const glowRef = useRef(null);
  const cueRef = useRef(null);

  // Scrub bookkeeping lives in refs so the scroll loop never re-renders.
  const rafRef = useRef(0);
  const durationRef = useRef(0);
  const easedRef = useRef(0); // scrub position, 0–1
  const lastTimeRef = useRef(0);
  const stillsRef = useRef([]); // decoded <img> per still, null until loaded
  const drawnKeyRef = useRef(''); // what the canvas currently shows
  const videoShownRef = useRef(false); // the video has taken over from the stills

  // Object URL for the fully downloaded clip; null until the fetch completes.
  const [videoSrc, setVideoSrc] = useState(null);
  const [startVideo, setStartVideo] = useState(false);

  // Decided once on mount. Swapping the source on resize would restart the
  // download mid-scroll, which is worse than serving a phone the desktop clip.
  const [{ mode, withVideo }] = useState(detectHero);

  // `svh` ignores the mobile URL bar, so the pinned stage does not resize (and
  // visibly jump) as the browser chrome collapses. Resolved once, with a vh
  // fallback for browsers that predate the unit.
  const [unit] = useState(() => {
    if (typeof CSS === 'undefined' || !CSS.supports) return 'vh';
    return CSS.supports('height', '100svh') ? 'svh' : 'vh';
  });

  const isStatic = mode === 'static';
  const scrollLength = mode === 'mobile' ? SCROLL_LENGTH_MOBILE : SCROLL_LENGTH_DESKTOP;

  // Load the flip-book stills, coarse to fine, a few at a time. Each one is
  // decoded before it is used, so drawing it never stalls a frame.
  useEffect(() => {
    if (isStatic) return undefined;
    let stopped = false;
    const urls = mode === 'mobile' ? STILLS_PORTRAIT : STILLS_LANDSCAPE;
    const stills = new Array(urls.length).fill(null);
    stillsRef.current = stills;
    const queue = coarseToFine(urls.length);
    let loaded = 0;
    // The poster is the same first frame at full size: once it has loaded it
    // replaces the small still, so the start of the walk-in is sharp.
    const poster = posterRef.current;
    const adoptPoster = () => {
      if (poster?.naturalWidth) {
        stills[0] = poster;
        drawnKeyRef.current = '';
      }
    };
    if (poster?.complete) adoptPoster();
    else poster?.addEventListener('load', adoptPoster, { once: true });

    const videoTimer = window.setTimeout(() => setStartVideo(true), VIDEO_START_FALLBACK_MS);

    const worker = async () => {
      while (!stopped && queue.length && !videoShownRef.current) {
        const index = queue.shift();
        const img = new Image();
        img.decoding = 'async';
        img.src = urls[index];
        try {
          await img.decode();
        } catch {
          continue; // a missing still just leaves a wider gap to cross-fade
        }
        if (stopped) return;
        if (!stills[index]) stills[index] = img; // never replace the poster
        drawnKeyRef.current = ''; // redraw with the new still
        loaded += 1;
        if (loaded === STILLS_BEFORE_VIDEO) setStartVideo(true);
      }
    };
    for (let i = 0; i < PARALLEL_STILL_LOADS; i += 1) worker();

    return () => {
      stopped = true;
      window.clearTimeout(videoTimer);
      poster?.removeEventListener('load', adoptPoster);
    };
  }, [isStatic, mode]);

  // Download the whole clip instead of streaming it into <video>.
  //  - Mobile Safari and data-saver modes ignore preload="auto" and may never
  //    fetch a muted, never-played video.
  //  - A streamed clip turns every seek past the buffered range into a network
  //    round trip, so scrubbing stalled. From a Blob every seek is local.
  // Low priority, after the first stills: until it arrives, they are the
  // hero. It's cached long-term (vercel.json), so repeat visits start at once.
  useEffect(() => {
    if (isStatic || !withVideo || !startVideo) return undefined;

    const controller = new AbortController();
    let objectUrl = null;

    (async () => {
      try {
        const response = await fetch(mode === 'mobile' ? storeEntryMobile : storeEntryDesktop, {
          signal: controller.signal,
          priority: 'low',
        });
        if (!response.ok) return; // the stills carry on as the hero
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);
      } catch {
        // Aborted or offline: the stills carry on as the hero
      }
    })();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isStatic, withVideo, startVideo, mode]);

  useEffect(() => {
    if (isStatic) return undefined;

    const section = sectionRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!section || !video || !canvas) return undefined;
    const ctx = canvas.getContext('2d');

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
            // Autoplay refused. Seeking still works once buffered.
          });
      }
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    if (video.readyState >= 1) handleMetadata();

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

    // Draw the flip-book at `position` (0–1): the nearest loaded still on
    // each side, the later one cross-faded in by how far between them we are.
    // Returns whether anything was drawn.
    const drawStills = (position) => {
      const stills = stillsRef.current;
      if (!stills.length) return false;

      // Size the canvas to its box (capped: the stills are only 640px wide)
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        drawnKeyRef.current = '';
      }

      const exact = position * (stills.length - 1);
      let before = Math.floor(exact);
      let after = Math.ceil(exact);
      while (before > 0 && !stills[before]) before -= 1;
      while (after < stills.length - 1 && !stills[after]) after += 1;
      if (!stills[before]) before = after;
      if (!stills[after]) after = before;
      if (!stills[before]) return false;
      let mix = after > before ? clamp((exact - before) / (after - before)) : 0;
      if (after - before > MAX_CROSSFADE_GAP) mix = Math.round(mix);

      const key = `${before}|${after}|${Math.round(mix * 40)}`;
      if (key === drawnKeyRef.current) return true;
      drawnKeyRef.current = key;

      // object-fit: cover
      const draw = (img, alpha) => {
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      };
      if (mix >= 1) draw(stills[after], 1);
      else {
        draw(stills[before], 1);
        if (after !== before && mix > 0.01) draw(stills[after], mix);
      }
      ctx.globalAlpha = 1;
      return true;
    };

    const frame = (now) => {
      if (cancelled) return;

      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - window.innerHeight;
      const progress = travel > 0 ? clamp(-rect.top / travel) : 0;

      // Camera move and copy fade follow the scroll directly.
      applyVisuals(progress);

      // Position -> clip position. Deliberately not velocity based: the same
      // scroll offset always resolves to the same frame, in either direction.
      // The scrub finishes at SCRUB_PORTION so the tail of the pin holds the
      // last frame rather than releasing the moment it arrives.
      const target = clamp(progress / SCRUB_PORTION);

      // Frame-rate independent easing: raising (1 - ease) to the elapsed frame
      // count keeps the response identical at 60Hz and 120Hz.
      const prev = lastTimeRef.current || now;
      const deltaFrames = clamp((now - prev) / (1000 / 60), 0, 4);
      lastTimeRef.current = now;
      const alpha = 1 - Math.pow(1 - SCRUB_EASE, deltaFrames);
      let eased = easedRef.current + (target - easedRef.current) * alpha;
      if (Math.abs(target - eased) < 0.0005) eased = target; // settle exactly
      easedRef.current = eased;

      const duration = durationRef.current;
      if (duration > 0 && video.readyState >= 2) {
        // Snap to the clip's own frame grid, then only seek when that lands on
        // a different frame than the one already shown.
        const snapped = Math.min(duration, Math.round((eased * duration) / FRAME_STEP) * FRAME_STEP);
        const onFrame = Math.abs(video.currentTime - snapped) < FRAME_STEP * 0.5;
        if (!video.seeking && !onFrame) video.currentTime = snapped;

        // Hand over from the stills only once the video shows the same frame,
        // so the switch is invisible.
        if (!videoShownRef.current && !video.seeking && onFrame) {
          videoShownRef.current = true;
          video.style.opacity = '1';
          canvas.style.opacity = '0';
        }
      }

      const drewStills = videoShownRef.current ? false : drawStills(eased);

      // The poster is the sharp full-size first frame: once fully downloaded
      // it fades in over the blurred preview, stays on top at the very start,
      // and fades out once the walk-in moves (or the video is showing).
      const poster = posterRef.current;
      if (poster) {
        const loaded = poster.complete && poster.naturalWidth > 0;
        const hide = !loaded || videoShownRef.current || (drewStills && eased > 0.004);
        poster.style.opacity = hide ? '0' : '1';
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
      drawnKeyRef.current = '';
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

  // Reduced motion: keep the same framing and copy as a still, so the section
  // still reads as the store entrance.
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
            carries the camera movement. Layers, bottom to top: the blurred
            inline preview, the flip-book stills, the video once it has taken
            over, the sharp poster. */}
        <div
          ref={stageRef}
          className="absolute inset-0 will-change-transform"
          style={{ transform: 'perspective(1500px) scale(1.1)' }}
        >
          <div
            className="absolute inset-0 scale-110 blur-xl"
            style={{ backgroundImage: `url(${POSTER_PREVIEW})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            aria-hidden="true"
          />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0 }}
            src={videoSrc || undefined}
            preload="auto"
            muted
            playsInline
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
          />
          <img
            ref={posterRef}
            src={storeEntryPoster}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: 0 }}
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
