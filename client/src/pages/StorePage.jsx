import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import { HiOutlineArrowRight, HiOutlineUpload } from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage, handleImageError } from '../utils/imageOptimizer';
import API from '../utils/api';
import SEO from '../components/seo/SEO';
import 'swiper/css';
import 'swiper/css/free-mode';

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
import customizeImg from '../assets/image/store page/Rectangle 102.png';
import collab1 from '../assets/image/store page/Rectangle 174.png';
import collab2 from '../assets/image/store page/Rectangle 174 (1).png';
import collab3 from '../assets/image/store page/Rectangle 174 (2).png';
import tranq1 from '../assets/image/store page/Rectangle 174 (3).png';
import tranq2 from '../assets/image/store page/Rectangle 174 (4).png';
import tranq3 from '../assets/image/store page/Rectangle 174 (5).png';

const HERO_STRIP = [strip1, strip2, strip3, strip4, strip5, strip6, strip7];

// Initial vertical stagger for the gallery (repeats every 3): 60px, 30px, 0px.
const STAGGER = [60, 30, 0];

// A gallery image that starts pushed down by `base` and rises to 0 as the
// section scrolls into view (scroll-linked, like the reference video).
const GalleryImage = ({ src, base, progress }) => {
  const y = useTransform(progress, [0, 1], [base, 0]);
  return (
    <motion.div
      style={{ y }}
      className="flex-shrink-0 w-32 sm:w-40 md:w-48 lg:w-52 aspect-[5/4] rounded-2xl overflow-hidden bg-cream-dark"
    >
      <img
        src={src}
        alt="Customers with their canvases"
        loading="lazy"
        onError={handleImageError}
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop';

const GIFT_IMAGE =
  'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&auto=format&fit=crop';

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
  { title: 'Community gathering', blurb: 'Connect with people who share your passion for creativity.', image: collab3, gradient: '#8E9096', dark: false },
];

const TRANQUILITY_CARDS = [
  { title: 'Luxury poolside stays', blurb: 'Curated escapes where nature, comfort and unforgettable moments come together.', image: tranq1, gradient: '#FCDC86', dark: true },
  { title: 'Infinite horizons', blurb: 'Take in uninterrupted sea views from beautifully designed stays overlooking the coastline.', image: tranq2, gradient: '#A7D5F7', dark: true },
  { title: 'Breathtaking Views', blurb: 'Experience panoramic landscapes where every sunrise and sunset becomes an unforgettable memory.', image: tranq3, gradient: '#AECFF0', dark: true },
];

// Two-tone heading: bold dark phrase followed by a lighter trailing phrase.
const Heading = ({ bold, light, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-7 sm:mb-9">
    <h2 className="font-heading text-2xl sm:text-3xl md:text-[2.25rem] font-bold leading-tight tracking-tight">
      <span className="text-gray-900">{bold}</span>{' '}
      <span className="text-gray-400 font-semibold">{light}</span>
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
const BlurBand = ({ height, gradient, children }) => (
  <div className="absolute top-0 left-0 right-0" style={{ height: `${height}px` }}>
    <div
      className="absolute inset-0"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: `linear-gradient(180deg, ${gradient} 0%, ${gradient}00 100%)`,
        maskImage: 'linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)',
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
    <BlurBand height={130} gradient={gradient}>
      <h3 className={`font-heading font-bold text-base sm:text-lg leading-tight ${dark ? 'text-gray-900' : 'text-white drop-shadow-md'}`}>{title}</h3>
      <p className={`text-xs sm:text-sm mt-1 leading-snug ${dark ? 'text-gray-700' : 'text-white/90 drop-shadow-md'}`}>{blurb}</p>
    </BlurBand>
  </div>
);

const StorePage = () => {
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const nextRef = useRef(null);
  const galleryRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: galleryRef,
    offset: ['start end', 'start center'],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await API.get('/products', {
          params: { limit: 12, categorySlug: 'wall-canvas' },
        });
        if (!cancelled) setCanvases(data.products || []);
      } catch (_) {
        if (!cancelled) setCanvases([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <SEO
        title="Store | Art, Experiences & Personalized Creations | GPSFDK"
        description="Discover GPSFDK's curated store: museum-grade canvases, custom nameplates, workshops, retreats, and personalized gifts — all in one place."
      />

      {/* ─── Hero header ─── */}
      <section className="pt-28 sm:pt-32 pb-6 section-padding">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold text-gray-900 leading-none">
            Store
          </h1>
          <div className="sm:text-right">
            <p className="text-gray-900 font-bold text-base sm:text-lg leading-snug max-w-xs sm:ml-auto">
              The best way to buy the products you love.
            </p>
            <div className="mt-1 sm:flex sm:justify-end">
              <ArrowLink to="/contact">Connect with a Specialist</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lifestyle gallery (scroll-linked vertical stagger) ─── */}
      <section ref={galleryRef} className="pb-20 overflow-hidden">
        <div className="flex justify-center gap-3 sm:gap-4 px-2">
          {HERO_STRIP.map((src, i) => (
            <GalleryImage key={i} src={src} base={STAGGER[i % STAGGER.length]} progress={scrollYProgress} />
          ))}
        </div>
      </section>

      {/* ─── What we offer ─── */}
      <section className="py-20 section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="What we offer." light="To change your life." />
          <div className="flex flex-wrap items-start gap-y-6">
            {OFFER.map((o, i) => (
              <Link
                key={o.label}
                to={o.to}
                className={`group flex flex-col items-center text-center px-6 sm:px-9 ${
                  i > 0 ? 'border-l border-gray-200' : ''
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-cream-dark">
                  <img
                    src={o.img}
                    alt={o.label}
                    loading="lazy"
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-gray-700 text-xs sm:text-sm mt-2.5 font-medium group-hover:text-accent transition-colors">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: customize promo */}
            <Link
              to="/customize-canvas"
              className="group relative w-full max-w-[550px] rounded-2xl overflow-hidden block"
            >
              <img
                src={customizeImg}
                alt="Family beside a custom canvas of their portrait"
                loading="lazy"
                onError={handleImageError}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <BlurBand height={180} gradient="#E4DBCF">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">
                  Customize Canvas
                </span>
                <h3 className="font-heading font-bold text-gray-900 text-lg sm:text-xl mt-1.5 leading-snug max-w-xs">
                  Turn your memories into timeless artwork.
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm mt-1.5 max-w-xs">
                  Your memory. Beautifully transformed into timeless art.
                </p>
              </BlurBand>
            </Link>

            {/* Right: upload widget */}
            <Link
              to="/customize-canvas"
              className="group rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[320px] sm:min-h-[420px] hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center gap-5 text-[10px] font-bold tracking-widest uppercase text-accent">
                <span>Step 1: Upload</span>
                <span>Step 2: Customize</span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-gray-900 mt-3">
                Upload your photo
              </h3>
              <p className="text-gray-500 text-sm mt-2 max-w-xs">
                Upload a photo. Choose your style. We'll create the masterpiece.
              </p>

              <div className="mt-6 w-full max-w-sm rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-7 flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center">
                  <HiOutlineUpload className="w-5 h-5 text-accent" />
                </div>
                <p className="text-gray-400 text-xs">or drag and drop here</p>
                <p className="text-gray-400 text-[9px] uppercase tracking-widest mt-1">
                  JPG, PNG or WEBP · 500 KB to 10 MB (3 MB+ recommended)
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Artworks in motion (full-width canvas slider) ─── */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-[1200px] mx-auto section-padding">
          <Heading
            bold="Artworks in motion."
            light="This is what people say about us."
            action={<ArrowLink to="/wall-canvas">Explore Collections</ArrowLink>}
          />
        </div>

        {/* Slider gets a left gutter only so cards bleed off the right edge */}
        <div className="relative pl-4 sm:pl-6 lg:pl-8 xl:pl-16 2xl:pl-24">
          <Swiper
            modules={[Navigation, FreeMode]}
            spaceBetween={20}
            slidesPerView={1.3}
            freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
            grabCursor
            onBeforeInit={(swiper) => {
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            navigation={{ nextEl: nextRef.current }}
            breakpoints={{
              640: { slidesPerView: 2.3 },
              1024: { slidesPerView: 3.3 },
              1280: { slidesPerView: 4.3 },
            }}
          >
            {(loading ? Array.from({ length: 5 }) : canvases).map((p, i) => {
              if (loading) {
                return (
                  <SwiperSlide key={`canvas-skeleton-${i}`}>
                    <div className="animate-pulse">
                      <div className="aspect-[3/4] rounded-2xl bg-cream-dark" />
                      <div className="mt-3 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-cream-dark" />
                        <div className="h-4 w-1/3 rounded bg-cream-dark" />
                      </div>
                    </div>
                  </SwiperSlide>
                );
              }
              const prices = [p.basePrice, ...(p.variations || []).map(v => v.price)].filter(n => typeof n === 'number');
              const minPrice = prices.length ? Math.min(...prices) : (p.basePrice || 999);
              return (
                <SwiperSlide key={p._id || i}>
                  <Link to={`/product/${p.slug}`} className="group block">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-cream-dark">
                      <img
                        src={optimizeImage(p.images?.[0]?.url, 500) || PLACEHOLDER}
                        alt={p.name || 'Canvas artwork'}
                        onError={handleImageError}
                        loading={i < 5 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-3 pr-1">
                      <h3 className="font-heading font-semibold text-gray-900 text-sm sm:text-base leading-tight truncate">
                        {p.name || 'Canvas artwork'}
                      </h3>
                      <p className="text-accent font-bold text-sm mt-1">{formatPrice(minPrice)}</p>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Floating round next button (matches Figma) */}
          <button
            ref={nextRef}
            aria-label="Next"
            className="hidden sm:flex absolute right-4 sm:right-6 top-[38%] -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-accent text-white hover:bg-accent-dark active:scale-95 transition-all items-center justify-center shadow-lg"
          >
            <HiOutlineArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ─── Inspire and collaborate ─── */}
      <section className="py-20 section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="Inspire and collaborate." light="Where creativity brings people together." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {TRANQUILITY_CARDS.map((card) => (
              <OverlayCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── The art of giving ─── */}
      <section className="py-20 section-padding">
        <div className="max-w-[1200px] mx-auto">
          <Heading bold="Can't decide what to gift." light="Or create something truly personal." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: gift promo */}
            <Link
              to="/wall-canvas"
              className="group relative w-full max-w-[550px] rounded-2xl overflow-hidden block"
            >
              <img
                src={GIFT_IMAGE}
                alt="Grandparent receiving a personalized gift"
                loading="lazy"
                onError={handleImageError}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <BlurBand height={180} gradient="#E4DBCF">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">
                  The Art Of Giving
                </span>
                <h3 className="font-heading font-bold text-gray-900 text-lg sm:text-xl mt-1.5 leading-snug max-w-xs">
                  Find the perfect gift.
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm mt-1.5 max-w-xs">
                  Explore our bestselling personalized gifts, thoughtfully curated for every celebration and every story.
                </p>
              </BlurBand>
            </Link>

            {/* Right: gift options */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[320px] sm:min-h-[420px]">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">
                The Art Of Giving
              </span>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                Create a gift that's truly theirs.
              </h3>
              <p className="text-gray-500 text-sm mt-2 max-w-sm">
                Whether you're choosing the perfect gift or creating something uniquely yours, we've got you covered.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="rounded-2xl bg-cream-dark/60 p-5 flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold font-heading">
                    A
                  </div>
                  <p className="text-gray-700 font-medium text-xs sm:text-sm mt-3">Our most gifted item !</p>
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
                  <p className="text-gray-700 font-medium text-xs sm:text-sm mt-3">Start customizing</p>
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

    </div>
  );
};

export default StorePage;
