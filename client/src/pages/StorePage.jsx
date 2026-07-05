import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { HiOutlineArrowRight, HiVolumeOff, HiVolumeUp } from 'react-icons/hi';
import { handleImageError } from '../utils/imageOptimizer';
import SEO from '../components/seo/SEO';
import 'swiper/css';

// ─── Figma store-page imagery (client/src/assets/image/store page) ───
import strip1 from '../assets/image/store page/Rectangle 155.png';
import strip2 from '../assets/image/store page/Rectangle 156.png';
import strip3 from '../assets/image/store page/Rectangle 157.png';
import strip4 from '../assets/image/store page/Rectangle 159.png';
import strip5 from '../assets/image/store page/Rectangle 160.png';
import strip6 from '../assets/image/store page/Rectangle 161.png';
import strip7 from '../assets/image/store page/Rectangle 162.png';
import offerCanvas from '../assets/image/store page/image 16.png';
import offerNameplate from '../assets/image/store page/image 18.png';
import offerConsultancy from '../assets/image/store page/portrait-happy-smiling-cheerful-beautiful-young-support-phone-operator-headset-with-laptop-isolated-white-wall 1.png';
import offerGetaway from '../assets/image/store page/image 21.png';
import offerEvents from '../assets/image/store page/image 22.png';
import customizeImg from '../assets/image/store page/Rectangle 102.webp';
import collab1 from '../assets/image/store page/Rectangle 174.webp';
import collab2 from '../assets/image/store page/Rectangle 174 (1).webp';
import collab3 from '../assets/image/store page/Rectangle 174 (2).webp';
import tranq1 from '../assets/image/store page/Rectangle 174 (3).webp';
import tranq2 from '../assets/image/store page/Rectangle 174 (4).webp';
import tranq3 from '../assets/image/store page/Rectangle 174 (5).webp';

// ─── Artworks-in-motion videos (filename doubles as the artwork title) ───
import vidBubblegum from '../assets/videos/Bubblegum Rebellion.mp4';
import vidDreaming from '../assets/videos/Dreaming-In-Colors.mp4';
import vidFeline from '../assets/videos/Feline-Preference.mp4';
import vidFlora from '../assets/videos/Flora Obscura.mp4';
import vidFragmented from '../assets/videos/Fragmented Soul.mp4';
import vidPalm from '../assets/videos/Palm-Springs-Prowl.mp4';
import vidWolf from '../assets/videos/The Wolf of Wall Street.mp4';
import vidSentinel from '../assets/videos/The-Sentinel.mp4';

const HERO_STRIP = [strip1, strip2, strip3, strip4, strip5, strip6, strip7];

const ARTWORK_VIDEOS = [
  { name: 'Bubblegum Rebellion', src: vidBubblegum, slug: 'bubblegum-rebellion' },
  { name: 'Dreaming in Colors', src: vidDreaming, slug: 'dreaming-in-colors' },
  { name: 'Feline Preference', src: vidFeline, slug: 'feline-preference' },
  { name: 'Flora Obscura', src: vidFlora, slug: 'flora-obscura-1' },
  { name: 'Fragmented Soul', src: vidFragmented, slug: 'fragmented-soul' },
  { name: 'Palm Springs Prowl', src: vidPalm, slug: 'palm-springs-prowl' },
  { name: 'The Wolf of Wall Street', src: vidWolf, slug: 'the-wolf-of-wall-street' },
  { name: 'The Sentinel', src: vidSentinel, slug: 'the-sentinel' },
];

// Per-image widths (px) — uneven widths, fixed 150px height (object-cover).
// Rendered as a seamless, continuously-scrolling infinite marquee.
const GALLERY_HEIGHT = 180;
const GALLERY_GAP = 16; // px gap between slides
// Widths track each source image's native aspect ratio at 180px tall, so none get
// upscaled horizontally (the narrow sources turned blurry when stretched wider).
const GALLERY_WIDTHS = [136, 203, 104, 101, 199, 130, 271];

// Width of one full set (incl. trailing gaps); the marquee shifts by this for a seamless loop.
const GALLERY_LOOP_WIDTH = HERO_STRIP.reduce(
  (sum, _, i) => sum + GALLERY_WIDTHS[i % GALLERY_WIDTHS.length] + GALLERY_GAP,
  0,
);

// One slide in the marquee.
const GalleryImage = ({ src, width }) => (
  <div
    style={{ width, height: GALLERY_HEIGHT }}
    className="flex-shrink-0 rounded-2xl overflow-hidden bg-cream-dark"
  >
    <img
      src={src}
      alt="Customers with their canvases"
      loading="lazy"
      onError={handleImageError}
      className="w-full h-full object-cover"
    />
  </div>
);

const OFFER = [
  { label: 'Canvas', img: offerCanvas, to: '/wall-canvas' },
  { label: 'Nameplates', img: offerNameplate, to: '/house-nameplates' },
  { label: 'Consultancy', img: offerConsultancy, to: '/contact' },
  { label: 'Getaway', img: offerGetaway, to: '/contact' },
  { label: 'Events', img: offerEvents, to: '/contact' },
];

const COLLABORATE_CARDS = [
  { title: 'Hands on workshop', blurb: 'Create, experiment and learn through guided workshops.', image: collab1, gradient: '#F0F0F0', dark: true },
  { title: 'Collaborative sessions', blurb: 'Exchange ideas with creators and industry experts.', image: collab2, gradient: '#000000', dark: false },
  { title: 'Community gathering', blurb: 'Connect with people who share your passion for creativity.', image: collab3, gradient: '#8E9096', dark: true },
];

const TRANQUILITY_CARDS = [
  { title: 'Luxury poolside stays', blurb: 'Curated escapes where nature, comfort and unforgettable moments come together.', image: tranq1, gradient: '#FCDC86', dark: true },
  { title: 'Infinite horizons', blurb: 'Take in uninterrupted sea views from beautifully designed stays overlooking the coastline.', image: tranq2, gradient: '#A7D5F7', dark: true },
  { title: 'Breathtaking Views', blurb: 'Experience panoramic landscapes where every sunrise and sunset becomes an unforgettable memory.', image: tranq3, gradient: '#AECFF0', dark: true },
];

// Stable references — inline objects would make swiper-react re-init (and reset)
// the slider on every parent re-render.
const ARTWORK_BREAKPOINTS = {
  640: { slidesPerView: 2.3 },
  1024: { slidesPerView: 3.3 },
  1280: { slidesPerView: 4.3 },
};

// Doubled so loop mode always has more slides than slidesPerView×2 (4.3 needs ≥9).
const ARTWORK_SLIDES = [...ARTWORK_VIDEOS, ...ARTWORK_VIDEOS];

// Carousel video that only plays while on screen. With 16 slides, letting them
// all autoplay meant 16 concurrently-decoding videos — heavy on CPU/GPU and
// mobile battery/data — so off-screen slides are paused via IntersectionObserver.
const ArtworkVideo = ({ src, isUnmuted }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // play() returns a promise that rejects if autoplay is blocked — ignore.
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Sync the DOM muted property directly — React's `muted` attribute doesn't
  // reliably update a playing element.
  useEffect(() => {
    if (ref.current) ref.current.muted = !isUnmuted;
  }, [isUnmuted]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
};

// Two-tone heading: bold dark phrase followed by a lighter trailing phrase.
const Heading = ({ bold, light, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-7 sm:mb-9">
    <h2 className="font-heading text-[28px] font-bold leading-[1.4] tracking-tight">
      <span className="text-[#1D1D1F]">{bold}</span>{' '}
      <span className="text-[#686868] font-semibold">{light}</span>
    </h2>
    {action}
  </div>
);

const ArrowLink = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1 text-accent font-semibold text-sm hover:gap-2 transition-all"
  >
    {children}
    <HiOutlineArrowRight className="w-4 h-4 -rotate-45" />
  </Link>
);

// Top band tinted with the card's `gradient` colour (fading to transparent), with a
// progressive "layer blur" (Figma-style) underneath. Holds the card text, 30px padding.
const BlurBand = ({ height, gradient, solidStop = 45, children }) => (
  <div className="absolute top-0 left-0 right-0" style={{ height: `${height}px` }}>
    <div
      className="absolute inset-0"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: `linear-gradient(180deg, ${gradient} 0%, ${gradient} ${solidStop}%, ${gradient}00 100%)`,
        // Long, gentle mask tail so the blurred region dissolves into the image
        // instead of ending in a visible seam.
        maskImage: 'linear-gradient(180deg, #000 0%, #000 30%, rgba(0,0,0,0.5) 60%, transparent 90%)',
        WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 30%, rgba(0,0,0,0.5) 60%, transparent 90%)',
      }}
    />
    <div className="relative p-[30px]">{children}</div>
  </div>
);

// 380×490 image card with a 130px colour-tinted progressive-blur band holding the title/blurb.
const OverlayCard = ({ title, blurb, image, gradient, dark }) => (
  <div className="group relative rounded-2xl overflow-hidden w-full max-w-[380px] aspect-[38/49] mx-auto">
    <img
      src={image}
      alt={title}
      loading="lazy"
      onError={handleImageError}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
    <BlurBand height={160} gradient={gradient}>
      <h3 className={`font-heading font-bold text-xl sm:text-[28px] leading-[1.4] ${dark ? 'text-[#1D1D1F]' : 'text-white'}`}>{title}</h3>
      <p className={`text-xs sm:text-[13px] mt-2.5 leading-snug ${dark ? 'text-[#1D1D1F]' : 'text-white/90'}`}>{blurb}</p>
    </BlurBand>
  </div>
);

const StorePage = () => {
  const artworkSwiperRef = useRef(null);
  // Index of the one slide with sound on (null = all muted) — a single-slot
  // "sound system" so two slides never talk over each other.
  const [unmutedIndex, setUnmutedIndex] = useState(null);

  const handleArtworkSwiper = useCallback((swiper) => {
    artworkSwiperRef.current = swiper;
  }, []);

  const handleSoundToggle = useCallback((e, index) => {
    // Inside a <Link> — keep the click from navigating to the product page.
    e.preventDefault();
    e.stopPropagation();
    setUnmutedIndex((cur) => (cur === index ? null : index));
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans text-[14px] font-normal leading-[1.5] text-[#1D1D1F]">
      <SEO
        title="Store | Art, Experiences & Personalized Creations | GPSFDK"
        description="Discover GPSFDK's curated store: museum-grade canvases, custom nameplates, workshops, retreats, and personalized gifts — all in one place."
      />

      {/* ─── Hero header ─── */}
      <section className="pt-28 sm:pt-32 pb-16 md:pb-[120px] section-padding">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-6xl sm:text-7xl md:text-[100px] font-heading font-bold text-[#1D1D1F] !leading-[0.9]">
            Store
          </h1>
          <div className="sm:text-right">
            <p className="text-[#1D1D1F] font-bold text-base sm:text-lg leading-snug sm:ml-auto">
              The best way to buy the <br /> products you love.
            </p>
            <div className="mt-1 sm:flex sm:justify-end">
              <ArrowLink to="/contact">Connect with a Specialist</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lifestyle gallery (infinite marquee) ─── */}
      <section className="pb-20 overflow-hidden">
        <motion.div
          className="flex w-max"
          style={{ gap: GALLERY_GAP }}
          animate={{ x: [0, -GALLERY_LOOP_WIDTH] }}
          transition={{ duration: GALLERY_LOOP_WIDTH / 50, ease: 'linear', repeat: Infinity }}
        >
          {[...HERO_STRIP, ...HERO_STRIP].map((src, i) => (
            <GalleryImage key={i} src={src} width={GALLERY_WIDTHS[i % HERO_STRIP.length]} />
          ))}
        </motion.div>
      </section>

      {/* ─── What we offer ─── */}
      <section className="py-20 section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="What we offer." light="To change your life." />
          <div className="flex flex-wrap items-end justify-center sm:justify-start gap-x-10 gap-y-10 sm:gap-x-12 lg:gap-x-[70px]">
            {OFFER.map((o) => (
              <Link
                key={o.label}
                to={o.to}
                className="group flex flex-col items-center text-center"
              >
                <div className="h-28 flex items-end justify-center">
                  <img
                    src={o.img}
                    alt={o.label}
                    loading="lazy"
                    onError={handleImageError}
                    className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-[#1D1D1F] text-sm sm:text-base mt-4 font-medium group-hover:text-accent transition-colors">
                  {o.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Customize canvas ─── */}
      <section className="py-20 section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="Can't decide what to gift." light="Want to customize" />
          {/* fr units keep the Figma 510:660 ratio but scale with the container —
              fixed px columns (510+660+60 gap = 1230px) overflowed the 1200px
              wrapper and every viewport below ~1290px. */}
          <div className="grid grid-cols-1 md:grid-cols-[510fr_660fr] gap-8 lg:gap-[60px] items-stretch">
            {/* Left: customize promo */}
            <Link
              to="/customize-canvas"
              className="group relative rounded-3xl overflow-hidden hidden md:block min-h-[320px] sm:h-[500px]"
            >
              <img
                src={customizeImg}
                alt="Family beside a custom canvas of their portrait"
                loading="lazy"
                onError={handleImageError}
                className="absolute inset-0 w-full h-full object-cover object-center scale-[1.14] transition-transform duration-700 group-hover:scale-[1.2]"
              />
              <BlurBand height={190} gradient="#E7DFD2">
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#1D1D1F]">
                  Customize Canvas
                </span>
                <h3 className="font-heading font-bold text-[#1D1D1F] text-xl sm:text-[28px] mt-2 leading-[1.4] max-w-sm">
                  Turn your memories into timeless artwork.
                </h3>
                <p className="text-[#1D1D1F] text-xs sm:text-sm mt-2 max-w-sm">
                  Your memories. Beautifully transformed into timeless art.
                </p>
              </BlurBand>
            </Link>

            {/* Right: gift options */}
            <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_2px_24px_rgba(0,0,0,0.05)] p-6 sm:p-10 flex flex-col items-center justify-center text-center min-h-[320px] sm:h-[500px]">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">
                The Art Of Giving
              </span>
              <h3 className="font-heading text-xl sm:text-[28px] leading-[1.4] font-bold text-[#1D1D1F] mt-2">
                Create a gift that's truly theirs.
              </h3>
              <p className="text-[#1D1D1F] text-sm mt-2 max-w-sm">
                Whether you're choosing the perfect gift or creating something uniquely yours, we've got you covered.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="rounded-2xl bg-cream-dark/60 p-5 flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold font-heading">
                    A
                  </div>
                  <p className="text-[#1D1D1F] font-medium text-xs sm:text-sm mt-3">Our most gifted item !</p>
                  <Link
                    to="/wall-canvas"
                    className="mt-3 inline-flex items-center justify-center bg-accent hover:bg-accent-dark text-white text-xs font-semibold py-2 px-4 rounded-full transition-colors"
                  >
                    Find gift
                  </Link>
                </div>
                <div className="rounded-2xl bg-cream-dark/60 p-5 flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold font-heading">
                    B
                  </div>
                  <p className="text-[#1D1D1F] font-medium text-xs sm:text-sm mt-3">Start customizing</p>
                  <Link
                    to="/customize-canvas"
                    className="mt-3 inline-flex items-center justify-center bg-accent hover:bg-accent-dark text-white text-xs font-semibold py-2 px-4 rounded-full transition-colors"
                  >
                    Design now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Artworks in motion (full-width video slider) ─── */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5">
          <Heading
            bold="Artworks in motion."
            light="This is what people say about us."
            action={<ArrowLink to="/wall-canvas">Explore Collections</ArrowLink>}
          />
        </div>

        {/* Full-width slider with a left gutter so the first card aligns with the
            content column; !overflow-visible lets scrolled cards run to the true
            left screen edge (the section clips them) instead of vanishing at the
            gutter boundary. */}
        <div className="relative pl-4 sm:pl-6 lg:pl-8 xl:pl-16 2xl:pl-24">
          <Swiper
            className="!overflow-visible"
            spaceBetween={20}
            slidesPerView={1.3}
            loop
            speed={500}
            grabCursor
            onSwiper={handleArtworkSwiper}
            breakpoints={ARTWORK_BREAKPOINTS}
          >
            {ARTWORK_SLIDES.map((v, i) => (
              <SwiperSlide key={`${v.name}-${i}`}>
                <Link to={`/product/${v.slug}`} className="group block">
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-cream-dark">
                    <ArtworkVideo src={v.src} isUnmuted={unmutedIndex === i} />
                    <button
                      onClick={(e) => handleSoundToggle(e, i)}
                      aria-label={unmutedIndex === i ? 'Mute video' : 'Unmute video'}
                      title={unmutedIndex === i ? 'Mute' : 'Unmute'}
                      className="absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 hover:scale-110 transition-all duration-300 shadow-lg"
                    >
                      {unmutedIndex === i ? (
                        <HiVolumeUp className="w-4 h-4" />
                      ) : (
                        <HiVolumeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 pr-1">
                    <h3 className="font-heading font-semibold text-[#1D1D1F] text-sm sm:text-base leading-tight truncate group-hover:text-accent transition-colors">
                      {v.name}
                    </h3>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Floating round prev/next buttons (matches Figma) */}
          <button
            aria-label="Previous"
            onClick={() => artworkSwiperRef.current?.slidePrev()}
            className="hidden sm:flex absolute left-2 sm:left-4 top-[38%] -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-accent text-white hover:bg-accent-dark active:scale-95 transition-all items-center justify-center shadow-lg"
          >
            <HiOutlineArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <button
            aria-label="Next"
            onClick={() => artworkSwiperRef.current?.slideNext()}
            className="hidden sm:flex absolute right-2 sm:right-4 top-[38%] -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-accent text-white hover:bg-accent-dark active:scale-95 transition-all items-center justify-center shadow-lg"
          >
            <HiOutlineArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ─── Inspire and collaborate ─── */}
      <section className="py-20 section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="Inspire and collaborate." light="Where creativity brings people together." />
          {/* 3-up only from md — at sm widths three columns squeeze the cards to
              ~190px, where the 160px blur band swallows the whole image. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[30px]">
            {COLLABORATE_CARDS.map((card) => (
              <OverlayCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Escape into tranquility ─── */}
      <section className="py-20 section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="Escape into tranquility." light="Find your perfect retreat." />
          {/* 3-up only from md — at sm widths three columns squeeze the cards to
              ~190px, where the 160px blur band swallows the whole image. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[30px]">
            {TRANQUILITY_CARDS.map((card) => (
              <OverlayCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default StorePage;
