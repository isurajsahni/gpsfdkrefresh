import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import {
  HiOutlineArrowRight,
  HiOutlineUpload,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineChatAlt2,
  HiOutlineSun,
  HiOutlineGlobe,
  HiOutlineMap,
  HiOutlineGift,
  HiOutlinePencilAlt,
} from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage, handleImageError } from '../utils/imageOptimizer';
import API from '../utils/api';
import SEO from '../components/seo/SEO';
import VideoShowcase from '../components/home/VideoShowcase';
import WebflowButton from '../components/ui/WebflowButton';
import canvasPoster from '../assets/image/wallcanvas_poster_1.webp';
import nameplatePoster from '../assets/image/housenameplate_poster.webp';
import 'swiper/css';
import 'swiper/css/free-mode';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop';

const COLLABORATE_CARDS = [
  {
    title: 'Hands on workshop',
    blurb: 'Learn and create',
    icon: HiOutlineSparkles,
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop',
  },
  {
    title: 'Collaborative conferences',
    blurb: 'Innovate together',
    icon: HiOutlineUsers,
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop',
  },
  {
    title: 'Community gathering',
    blurb: 'Connect and inspire',
    icon: HiOutlineChatAlt2,
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop',
  },
];

const TRANQUILITY_CARDS = [
  {
    title: 'Luxury poolside stays',
    blurb: 'Private tranquility',
    icon: HiOutlineSun,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
  },
  {
    title: 'Infinite horizons',
    blurb: 'Sea and sky view',
    icon: HiOutlineGlobe,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  },
  {
    title: 'Breathtaking views',
    blurb: "Nature's escape",
    icon: HiOutlineMap,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop',
  },
];

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const { formatPrice } = useCurrency();
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Most-sold products (by units sold), with featured items filling any gap
        // — see getHotSellingProducts. Fall back to the general wall-canvas catalogue
        // if it returns nothing so the slider never renders empty.
        const { data } = await API.get('/products/hot-selling');
        let list = data.products || [];
        if (!list.length) {
          const fb = await API.get('/products', { params: { limit: 12, categorySlug: 'wall-canvas' } });
          list = fb.data.products || [];
        }
        if (!cancelled) setProducts(list);
      } catch (_) {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-primary min-h-screen">
      <SEO
        title="Store | Art, Experiences & Personalized Creations | GPSFDK"
        description="Discover GPSFDK's curated store: museum-grade canvases, custom nameplates, workshops, retreats, and personalized gifts — all in one place."
      />

      {/* ─── Hero header ─── */}
      <section className="pt-28 sm:pt-32 pb-8 section-padding">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold text-secondary leading-none">Store</h1>
            <p className="text-gray-500 font-body mt-3 text-sm sm:text-base">
              Discover art, experiences, learning and personalized creations
            </p>
          </div>
          <Link
            to="/contact"
            className="flex items-center gap-3 group w-fit"
          >
            <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
              <HiOutlineChatAlt2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-secondary font-bold text-sm">Need guidance?</p>
              <p className="text-gray-500 text-xs group-hover:text-accent transition-colors flex items-center gap-1">
                Talk to our team <HiOutlineArrowRight className="w-3 h-3" />
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Inspired by your journey ─── */}
      <section className="pb-16 section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-secondary">
                Inspired by your <span className="text-accent italic">journey</span>
              </h2>
              <Link
                to="/wall-canvas"
                className="group/viewall inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-dark transition-colors whitespace-nowrap"
              >
                View all
                <HiOutlineArrowRight className="w-4 h-4 transition-transform group-hover/viewall:translate-x-1" />
              </Link>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                ref={prevRef}
                aria-label="Previous"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-secondary hover:bg-secondary hover:text-white transition-colors flex items-center justify-center"
              >
                <HiOutlineArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button
                ref={nextRef}
                aria-label="Next"
                className="w-10 h-10 rounded-full bg-accent text-white hover:bg-accent-dark transition-colors flex items-center justify-center"
              >
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Swiper
            modules={[Navigation, FreeMode]}
            spaceBetween={20}
            slidesPerView={1.2}
            freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
            grabCursor
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 },
              1280: { slidesPerView: 4 },
            }}
          >
            {(products.length ? products : Array.from({ length: 4 })).map((p, i) => {
              const prices = p ? [p.basePrice, ...(p.variations || []).map(v => v.price)].filter(n => typeof n === 'number') : [];
              const minPrice = prices.length ? Math.min(...prices) : (p?.basePrice || 999);
              return (
                <SwiperSlide key={p?._id || i}>
                  <Link to={p ? `/product/${p.slug}` : '/wall-canvas'} className="group block">
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream-dark">
                      <img
                        src={p ? (optimizeImage(p.images?.[0]?.url, 500) || PLACEHOLDER) : PLACEHOLDER}
                        alt={p?.name || 'Featured artwork'}
                        onError={handleImageError}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-3 px-1">
                      <h3 className="font-heading font-semibold text-secondary text-base sm:text-lg leading-tight truncate">
                        {p?.name || 'Coming soon'}
                      </h3>
                      {p?.shortDescription && (
                        <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">{p.shortDescription}</p>
                      )}
                      <p className="text-accent font-bold mt-2">{formatPrice(minPrice)}</p>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </section>

      {/* ─── What we offer to change your lifestyle ─── */}
      <section className="pb-16 section-padding">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-secondary mb-8">
            What we offer to change your <span className="text-secondary italic underline decoration-accent decoration-4 underline-offset-4">lifestyle</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[0.8fr_0.8fr_1.2fr] gap-4 sm:gap-5 lg:auto-rows-[560px]">
            {/* Canvas card */}
            <Link
              to="/wall-canvas"
              className="group relative h-[480px] sm:h-[520px] lg:h-full rounded-3xl overflow-hidden block"
            >
              <img
                src={canvasPoster}
                alt="Canvas wall art"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <h3 className="font-heading font-bold text-xl">Canvas</h3>
                <p className="text-white/80 text-sm">Bring life to every wall</p>
              </div>
              <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white text-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                <HiOutlineArrowRight className="w-4 h-4 -rotate-45" />
              </div>
            </Link>

            {/* Nameplates card */}
            <Link
              to="/house-nameplates"
              className="group relative h-[480px] sm:h-[520px] lg:h-full rounded-3xl overflow-hidden block"
            >
              <img
                src={nameplatePoster}
                alt="House nameplate"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <h3 className="font-heading font-bold text-xl">Nameplates</h3>
                <p className="text-white/80 text-sm">The first impression begins here</p>
              </div>
              <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white text-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                <HiOutlineArrowRight className="w-4 h-4 -rotate-45" />
              </div>
            </Link>

            {/* Upload widget */}
            <Link
              to="/customize-canvas"
              className="group relative h-[480px] sm:h-[520px] lg:h-full rounded-3xl overflow-hidden bg-[#f5edd8] flex flex-col items-center justify-center p-6 text-center sm:col-span-2 lg:col-span-1"
            >
              <div className="text-secondary">
                <p className="text-base sm:text-lg font-heading font-semibold leading-snug">
                  Turn your memories into
                </p>
                <p className="text-base sm:text-lg font-heading font-bold text-secondary">
                  <span className="text-secondary">timeless</span> <span className="text-secondary italic underline decoration-accent">artwork</span>
                </p>
              </div>

              <div className="mt-5 w-full max-w-[260px] bg-white border-2 border-dashed border-secondary/20 rounded-2xl p-5 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <HiOutlineUpload className="w-5 h-5 text-accent" />
                </div>
                <p className="text-secondary font-bold text-sm">Upload your photo</p>
                <p className="text-gray-500 text-xs">or drag and drop here</p>
                <p className="text-gray-400 text-[9px] uppercase tracking-widest mt-1">
                  JPG, PNG or WEBP · 500 KB to 10 MB (3 MB+ recommended)
                </p>
              </div>

              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold py-2 pl-5 pr-2 rounded-full transition-colors pointer-events-none"
                tabIndex={-1}
              >
                Continue
                <span className="w-7 h-7 rounded-full bg-white text-accent flex items-center justify-center">
                  <HiOutlineArrowRight className="w-3.5 h-3.5 -rotate-45" />
                </span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Artworks in Motion (video showcase) ─── */}
      <VideoShowcase />

      {/* ─── Inspire and collaborate ─── */}
      <section className="pb-16 section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="bg-secondary rounded-3xl py-12 sm:py-16 px-6 sm:px-10 text-center text-white">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight">
              Inspire and <span className="text-accent italic">collaborate</span>
            </h2>
            <p className="text-white/70 mt-4 max-w-2xl mx-auto text-sm sm:text-base">
              Participate in thoughtfully curated workshops, conferences, and community gatherings designed to inspire creativity, collaboration, and personal growth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-10">
              {COLLABORATE_CARDS.map(({ title, blurb, icon: Icon, image }) => (
                <div key={title} className="relative bg-white rounded-2xl overflow-hidden text-left">
                  <div className="relative aspect-[16/10]">
                    <img src={image} alt={title} loading="lazy" onError={handleImageError} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-secondary text-base sm:text-lg">{title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{blurb}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <WebflowButton to="/contact">
                Explore upcoming events
              </WebflowButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Escape Into tranquility ─── */}
      <section className="pb-16 section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="bg-emerald-50 rounded-3xl py-12 sm:py-16 px-6 sm:px-10 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight text-secondary">
              Escape Into <span className="text-secondary italic underline decoration-accent decoration-4 underline-offset-4">tranquility</span>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-sm sm:text-base">
              Discover curated stays where nature, comfort, and meaningful experiences come together to create unforgettable moments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-10">
              {TRANQUILITY_CARDS.map(({ title, blurb, icon: Icon, image }) => (
                <div key={title} className="relative bg-white rounded-2xl overflow-hidden text-left shadow-sm">
                  <div className="relative aspect-[16/10]">
                    <img src={image} alt={title} loading="lazy" onError={handleImageError} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-secondary text-base sm:text-lg">{title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{blurb}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <WebflowButton to="/contact">
                Book your gateway
              </WebflowButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Art Of Giving ─── */}
      <section className="pb-24 section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-secondary text-white text-xs font-bold tracking-widest uppercase px-5 py-1.5 rounded-full">
            The Art Of Giving
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-secondary mt-6 leading-tight">
            Can't decide what to gift?<br />
            Want to <span className="italic underline decoration-accent decoration-4 underline-offset-4">customize</span>?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-10">
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold font-heading">A</div>
              <p className="text-secondary font-heading font-bold mt-4 text-base sm:text-lg">Our most gifted item !</p>
              <div className="mt-4">
                <Link
                  to="/wall-canvas"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold py-2 pl-5 pr-2 rounded-full transition-colors"
                >
                  Find gift
                  <span className="w-7 h-7 rounded-full bg-white text-accent flex items-center justify-center">
                    <HiOutlineGift className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold font-heading">B</div>
              <p className="text-secondary font-heading font-bold mt-4 text-base sm:text-lg">Start customizing</p>
              <div className="mt-4">
                <Link
                  to="/customize-canvas"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold py-2 pl-5 pr-2 rounded-full transition-colors"
                >
                  Design now
                  <span className="w-7 h-7 rounded-full bg-white text-accent flex items-center justify-center">
                    <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StorePage;
