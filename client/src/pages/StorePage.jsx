import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { HiPhotograph, HiPlus, HiVolumeOff, HiVolumeUp } from 'react-icons/hi';
import { handleImageError } from '../utils/imageOptimizer';
import SEO from '../components/seo/SEO';
import 'swiper/css';

// ─── Figma store-page imagery (client/src/assets/image/store page) ───
// "@2x" strips are lanczos-upscaled + sharpened from the 1x Figma exports so
// high-DPI screens aren't stuck with the browser's blurry bilinear upscale.
// True 2x Figma re-exports can drop in over these same filenames.
import strip1 from '../assets/image/store page/Rectangle 155 @2x.webp';
import strip2 from '../assets/image/store page/Rectangle 156 @2x.webp';
import strip3 from '../assets/image/store page/Rectangle 157 @2x.webp';
import strip4 from '../assets/image/store page/Rectangle 159 @2x.webp';
import strip5 from '../assets/image/store page/Rectangle 160 @2x.webp';
import strip6 from '../assets/image/store page/Rectangle 161 @2x.webp';
import strip7 from '../assets/image/store page/Rectangle 162 @2x.webp';
import offerCanvas from '../assets/image/store page/image 16.png';
import offerNameplate from '../assets/image/store page/image 18.png';
import offerConsultancy from '../assets/image/store page/portrait-happy-smiling-cheerful-beautiful-young-support-phone-operator-headset-with-laptop-isolated-white-wall 1.png';
import offerGetaway from '../assets/image/store page/image 21.png';
import offerEvents from '../assets/image/store page/image 22.png';
import giftedImg from '../assets/image/store page/newimg.png';
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
const GALLERY_HEIGHT = 150;
const GALLERY_GAP = 16; // px gap between slides
// Widths track each source image's native aspect ratio at 150px tall, so none get
// upscaled horizontally (the narrow sources turned blurry when stretched wider).
const GALLERY_WIDTHS = [113, 169, 87, 84, 166, 108, 226];

// Width of one full set (incl. trailing gaps); the marquee shifts by this for a seamless loop.
const GALLERY_LOOP_WIDTH = HERO_STRIP.reduce(
  (sum, _, i) => sum + GALLERY_WIDTHS[i % GALLERY_WIDTHS.length] + GALLERY_GAP,
  0,
);

// One slide in the marquee — links through to the wall-canvas collection.
const GalleryImage = ({ src, width }) => (
  <Link
    to="/wall-canvas"
    style={{ width, height: GALLERY_HEIGHT }}
    className="block flex-shrink-0 rounded-2xl overflow-hidden bg-cream-dark"
  >
    <img
      src={src}
      alt="Customers with their canvases"
      loading="lazy"
      onError={handleImageError}
      className="w-full h-full object-cover"
    />
  </Link>
);

// width: per-item Figma image width (px); height follows each image's ratio.
const OFFER = [
  { label: 'Canvas', img: offerCanvas, to: '/wall-canvas', width: 160 },
  { label: 'Nameplates', img: offerNameplate, to: '/house-nameplates', width: 150 },
  { label: 'Consultancy', img: offerConsultancy, to: '/contact', width: 135 },
  { label: 'Getaway', img: offerGetaway, to: '/contact', width: 156 },
  { label: 'Events', img: offerEvents, to: '/contact', width: 160 },
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

// Doubled so loop mode always has comfortably more slides than fit on screen
// (fixed 280px cards → ~5 visible on wide desktops, loop wants ≥ 2×visible).
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
  <div className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8 lg:mb-10">
    <h2 className="apple-headline font-heading">
      <span className="text-[#1D1D1F]">{bold}</span>{' '}
      <span className="text-[#686868]">{light}</span>
    </h2>
    {action}
  </div>
);

// Chevron from the Figma file (Downloads/Group.svg); size via className.
const FigmaChevron = ({ className = 'w-[15px] h-auto' }) => (
  <svg viewBox="0 0 16 27" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M1.93922 27C1.55627 27.0022 1.18133 26.8903 0.86221 26.6786C0.543087 26.4669 0.294236 26.165 0.147386 25.8113C0.000536208 25.4576 -0.0376605 25.0682 0.0376661 24.6928C0.112993 24.3173 0.298429 23.9728 0.570334 23.7031L10.7888 13.5039L0.570334 3.30478C0.207284 2.94173 0.00332394 2.44933 0.00332394 1.93589C0.00332394 1.68167 0.053397 1.42993 0.150685 1.19506C0.247973 0.960186 0.39057 0.746775 0.570334 0.56701C0.750099 0.387246 0.963509 0.24465 1.19838 0.147362C1.43326 0.050074 1.68499 0 1.93922 0C2.45265 0 2.94505 0.20396 3.3081 0.56701L14.8761 12.135C15.2352 12.4963 15.4368 12.9849 15.4368 13.4943C15.4368 14.0036 15.2352 14.4923 14.8761 14.8535L3.3081 26.4216C3.12954 26.6037 2.9166 26.7487 2.68163 26.848C2.44665 26.9472 2.19431 26.9989 1.93922 27Z"
      fill="currentColor"
    />
  </svg>
);

// 8×8 diagonal arrow from the Figma file (Downloads/Group (1).svg).
const ArrowUpRight = () => (
  // translate-y: flex centers the 8px arrow on the full line box, which reads
  // ~2px high against the text's optical middle (descender space skews it).
  <svg
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-2 h-2 flex-shrink-0 translate-y-[1.5px]"
  >
    <path
      d="M6.669 2.27202L0.94102 8L0 7.05898L5.72731 1.331H0.679478V0H8V7.32052H6.669V2.27202Z"
      fill="currentColor"
    />
  </svg>
);

const ArrowLink = ({ to, children }) => (
  <Link
    to={to}
    className="apple-link inline-flex items-center gap-1 text-accent hover:gap-2 transition-all"
  >
    {children}
    <ArrowUpRight />
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
      <h3 className={`apple-tile-title font-heading ${dark ? 'text-[#1D1D1F]' : 'text-white'}`}>{title}</h3>
      <p className={`apple-caption mt-2.5 ${dark ? 'text-[#1D1D1F]' : 'text-white/90'}`}>{blurb}</p>
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
    <div className="store-apple bg-white min-h-screen font-sans text-[#1D1D1F]">
      <SEO
        title="Store | Art, Experiences & Personalized Creations | GPSFDK"
        description="Discover GPSFDK's curated store: museum-grade canvases, custom nameplates, workshops, retreats, and personalized gifts — all in one place."
      />

      {/* ─── Hero header ─── */}
      {/* pt-[130px] = 60px fixed navbar + 70px visual gap */}
      <section className="pt-[130px] pb-[50px] section-padding">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="apple-hero font-heading text-[#1D1D1F]">
            Store
          </h1>
          <div className="sm:text-right">
            <p className="apple-intro text-[#1D1D1F] sm:ml-auto">
              The best way to buy the <br /> products you love.
            </p>
            <div className="mt-1 sm:flex sm:justify-end">
              <ArrowLink to="/contact">Connect with a Specialist</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lifestyle gallery (infinite marquee) ─── */}
      <section className="overflow-hidden py-[30px]">
        <motion.div
          className="flex w-max"
          style={{ gap: GALLERY_GAP }}
          animate={{ x: [0, -GALLERY_LOOP_WIDTH] }}
          transition={{ duration: GALLERY_LOOP_WIDTH / 50, ease: 'linear', repeat: Infinity }}
        >
          {/* 4 copies: the marquee shifts by one set (~1065px), so the strip must
              always be ≥ viewport + one set wide or a blank gap scrolls through
              at the end of each cycle (covers viewports up to ~3200px). */}
          {[...HERO_STRIP, ...HERO_STRIP, ...HERO_STRIP, ...HERO_STRIP].map((src, i) => (
            <GalleryImage key={i} src={src} width={GALLERY_WIDTHS[i % HERO_STRIP.length]} />
          ))}
        </motion.div>
      </section>

      {/* ─── What we offer ─── */}
      <section className="pt-[70px] pb-[55px] section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="What we offer." light="To change your life." />
          <div className="w-full flex flex-wrap items-end justify-between gap-[30px] max-[500px]:grid max-[500px]:grid-cols-2 max-[500px]:gap-x-4 max-[500px]:gap-y-8 max-[500px]:justify-items-center">
            {OFFER.map((o) => (
              <Link
                key={o.label}
                to={o.to}
                className="group flex flex-col items-center text-center"
              >
                <img
                  src={o.img}
                  alt={o.label}
                  loading="lazy"
                  onError={handleImageError}
                  style={{ width: o.width }}
                  className="h-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="apple-body text-[#1D1D1F] mt-4 font-medium group-hover:text-accent transition-colors">
                  {o.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Customize canvas ─── */}
      <section className="py-[55px] section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="Can't decide what to gift." light="Want to customize ?" />
          {/* fr units keep the Figma 505:635 ratio but scale with the container —
              fixed px columns would overflow the 1200px wrapper on smaller
              viewports. Left card caps at its Figma width (505px), height auto. */}
          <div className="grid grid-cols-1 md:grid-cols-[505fr_635fr] gap-8 lg:gap-[60px] items-start">
            {/* Left: most-gifted items promo — text sits straight on the dark
                image (no blur band), per Figma. */}
            <Link
              to="/wall-canvas"
              className="group relative rounded-3xl overflow-hidden block w-full max-w-[505px]"
            >
              <img
                src={giftedImg}
                alt="Family gifting a framed canvas"
                loading="lazy"
                onError={handleImageError}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-0 left-0 right-0 p-[30px]">
                <h3 className="apple-tile-title font-heading text-white">
                  Our most gifted items
                </h3>
                <span className="apple-link mt-2 inline-flex items-center gap-1.5 text-accent group-hover:gap-2.5 transition-all">
                  Visit Collection
                  <FigmaChevron className="w-[7px] h-auto mt-1" />
                </span>
              </div>
            </Link>

            {/* Right: upload widget (Figma "Upload your photo") */}
            <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_6px_36px_rgba(0,0,0,0.12)] p-6 sm:p-10 flex flex-col items-center justify-center text-center h-full">
              <div className="apple-eyebrow flex flex-wrap items-center justify-center gap-3 sm:gap-8 uppercase text-accent">
                <span>Step 1: Upload</span>
                <span>Step 2: Customize</span>
              </div>
              <h3 className="apple-tile-title font-heading text-[#1D1D1F] mt-4">
                Upload your photo
              </h3>
              <p className="apple-body text-[#1D1D1F] mt-2.5 max-w-xs">
                Upload a photo. Choose your style. We'll create the masterpiece.
              </p>

              <Link
                to="/customize-canvas"
                className="group mt-7 w-full max-w-md rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-7 py-8 flex flex-col items-center gap-3 hover:border-accent/50 transition-colors"
              >
                <div className="relative">
                  <HiPhotograph className="w-12 h-12 text-[#F2A39C]" />
                  <span className="absolute -bottom-0.5 -right-1 w-5 h-5 rounded-full bg-[#E5484D] ring-2 ring-white flex items-center justify-center">
                    <HiPlus className="w-3 h-3 text-white" />
                  </span>
                </div>
                <p className="apple-body text-[#1D1D1F] mt-1">or drag and drop here</p>
                <p className="apple-caption text-[#1D1D1F]">
                  JPG, PNG or WEBP · 500 KB TO 10 MB (3 MB+ recommended)
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Artworks in motion (full-width video slider) ─── */}
      <section className="py-[50px] md:py-[55px] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5">
          <Heading
            bold="Artworks in motion."
            light="This is what people say about us."
            action={<ArrowLink to="/wall-canvas">Explore Collections</ArrowLink>}
          />
        </div>

        {/* Slider lives in the same 1200px column as the heading so the first
            card left-aligns with "Artworks in motion." exactly (Figma);
            !overflow-visible lets scrolled cards run to the true screen edges
            (the section clips them) instead of vanishing at the column edge. */}
        <div className="relative">
          <div className="max-w-[1200px] mx-auto px-5">
            {/* Fixed Figma card size (277×450) — slidesPerView="auto" lets each
                slide take its own 277px width at every viewport. */}
            <Swiper
              className="!overflow-visible"
              spaceBetween={20}
              slidesPerView="auto"
              loop
              speed={500}
              grabCursor
              onSwiper={handleArtworkSwiper}
            >
              {ARTWORK_SLIDES.map((v, i) => (
                <SwiperSlide key={`${v.name}-${i}`} className="!w-[277px]">
                  <Link to={`/product/${v.slug}`} className="group block">
                    <div className="relative w-[277px] h-[450px] rounded-2xl overflow-hidden bg-cream-dark">
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
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Figma prev/next: flat 56px accent circles with a white chevron,
              vertically centred on the 450px video cards (225px). */}
          <button
            aria-label="Previous"
            onClick={() => artworkSwiperRef.current?.slidePrev()}
            className="hidden sm:flex absolute left-2 sm:left-4 top-[225px] -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-accent text-white hover:bg-accent-dark active:scale-95 transition-all items-center justify-center"
          >
            <FigmaChevron className="w-[15px] h-auto rotate-180" />
          </button>
          <button
            aria-label="Next"
            onClick={() => artworkSwiperRef.current?.slideNext()}
            className="hidden sm:flex absolute right-2 sm:right-4 top-[225px] -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-accent text-white hover:bg-accent-dark active:scale-95 transition-all items-center justify-center"
          >
            <FigmaChevron />
          </button>
        </div>
      </section>

      {/* ─── Inspire and collaborate ─── */}
      <section className="py-[55px] section-padding">
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
      <section className="py-[55px] section-padding">
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
