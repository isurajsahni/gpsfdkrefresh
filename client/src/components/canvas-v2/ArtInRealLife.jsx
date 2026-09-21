import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiVolumeOff, HiVolumeUp } from 'react-icons/hi';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Shell, SectionHeading } from './Layout';
import { inView } from './motion';
import { useCurrency } from '../../context/CurrencyContext';

import felinePreference from '../../assets/videos/Feline-Preference.mp4';
import dreamingInColors from '../../assets/videos/Dreaming-In-Colors.mp4';
import palmSpringsProwl from '../../assets/videos/Palm-Springs-Prowl.mp4';
import theSentinel from '../../assets/videos/The-Sentinel.mp4';
import bubblegumRebellion from '../../assets/videos/Bubblegum Rebellion.mp4';
import wolfOfWallStreet from '../../assets/videos/The Wolf of Wall Street.mp4';
import nextCircle from '../../assets/image/canvas-v2/icons/carousel-next-circle.svg';
import nextChevron from '../../assets/image/canvas-v2/icons/carousel-chevron.svg';

/* ── Art in real life ─────────────────────────────────────────────────────────
   The frame's 277.5x450 grey cards (radius 20, 30px apart) are placeholders
   for the product reels, so the store's artwork clips fill them. Measured
   from the heading's line box top at 1440: cards at 76.4, section bottom at
   526.4 (the cards' bottom).

   Four cards exactly fill the 1200 column (4 x 277.5 + 3 x 30) and a fifth
   runs off the right of the screen, so the track starts at the column's left
   edge and ends at the viewport's right edge, clipped at both. The next circle
   sits 1239px into the track (x=1359 at 1440, on the fifth card) and centres
   on the clips — 225 - 28 = 197px down, not 50% of the slide, since the name
   and price sit below them. The frame has no previous button; ours mirrors the
   next one, 25px in from the track's left edge as the next is from its right
   at 1440.

   The frame's cards are silent and unlabelled. Ours carry the store's sound
   toggle in the top right and, under each clip, the reel's name and the price
   range a canvas of it spans, set like the product grid's cards below. */

const REELS = [
  { name: 'Feline Preference', slug: 'feline-preference', src: felinePreference },
  { name: 'Dreaming in Colors', slug: 'dreaming-in-colors', src: dreamingInColors },
  { name: 'Palm Springs Prowl', slug: 'palm-springs-prowl', src: palmSpringsProwl },
  { name: 'The Sentinel', slug: 'the-sentinel', src: theSentinel },
  { name: 'Bubblegum Rebellion', slug: 'bubblegum-rebellion', src: bubblegumRebellion },
  { name: 'The Wolf of Wall Street', slug: 'the-wolf-of-wall-street', src: wolfOfWallStreet },
];

/* What a canvas costs across every size and finish, as the store lists them.
   The reels aren't loaded from the API, so the range is the catalogue's rather
   than each product's; formatPrice converts it for overseas visitors. */
const PRICE_FROM = 149;
const PRICE_TO = 7999;

/* Swiper's loop needs at least one more slide than fits in the track. A 3440px
   ultrawide fits nine of these cards, so the six reels go round twice. */
const SLIDES = [0, 1].flatMap((copy) => REELS.map((reel) => ({ ...reel, key: `${reel.slug}-${copy}` })));

/* Arrows are md+ only: on phones the track is swiped, and the next card peeking
   in at the right edge already says there's more. */
const ARROW =
  'absolute top-[197px] z-10 hidden size-14 place-items-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:grid';

/* Same top-right badge as the store's artwork carousel. */
const SOUND_BUTTON =
  'absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-md transition duration-300 hover:scale-110 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

function ReelCard({ name, slug, src, unmuted, onToggleSound, formatPrice }) {
  const videoRef = useRef(null);

  // Play only while on screen, as VideoShowcase does: with preload="metadata"
  // a clip downloads once it scrolls or slides into view, and cards clipped
  // off either end of the track stay paused — which also silences an unmuted
  // clip the moment it slides out of the track.
  useEffect(() => {
    const el = videoRef.current;
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

  // Set on the element rather than through the attribute: React doesn't
  // reliably update `muted` on a video that's already playing.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !unmuted;
  }, [unmuted]);

  return (
    <div className="relative">
      <div className="isolate h-[357px] overflow-hidden rounded-[20px] bg-[#d9d9d9] md:h-[450px]">
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Above the name's stretched hit area, so it toggles sound instead of
          opening the product. */}
      <button
        type="button"
        onClick={onToggleSound}
        aria-label={unmuted ? `Mute ${name}` : `Unmute ${name}`}
        title={unmuted ? 'Mute' : 'Unmute'}
        className={SOUND_BUTTON}
      >
        {unmuted ? <HiVolumeUp className="size-4" /> : <HiVolumeOff className="size-4" />}
      </button>

      {/* Name and price as the product grid sets them, one size down to suit
          the narrower card. The link stretches over the clip as well, so the
          whole card opens the product from a single tab stop; draggable={false}
          keeps a mouse drag from picking the link up and cancelling the swipe.
          Its focus ring is drawn inside the card because the track clips
          anything outside it. */}
      <h3 className="mt-[14px] text-[16px] font-medium leading-[1.19] text-black md:text-[20px]">
        <Link
          to={`/product/${slug}`}
          draggable={false}
          className="block after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-inset focus-visible:after:ring-accent"
        >
          {/* The clipping sits on the span: `truncate` on the link or the
              heading would be an overflow ancestor of the stretched ::after. */}
          <span className="block truncate">{name}</span>
        </Link>
      </h3>
      <p className="mt-[6px] truncate text-[14px] font-normal leading-[1.19] text-accent md:text-[16px]">
        {formatPrice(PRICE_FROM)} – {formatPrice(PRICE_TO)}
      </p>
    </div>
  );
}

export default function ArtInRealLife() {
  const swiperRef = useRef(null);
  const { formatPrice } = useCurrency();

  // The key of the one card playing with sound (null = all muted), so two
  // clips never talk over each other — including the two copies of a reel the
  // loop needs, which is why this keys on the slide and not the product.
  const [unmutedKey, setUnmutedKey] = useState(null);
  const toggleSound = useCallback((key) => {
    setUnmutedKey((current) => (current === key ? null : key));
  }, []);

  // Tabbing onto a card outside the track's clip would leave focus somewhere
  // you can't see (Swiper doesn't follow focus), so bring that card to the
  // front. Mouse and touch focus don't match :focus-visible, so a click on the
  // peeking fifth card never moves the track out from under the pointer.
  const revealFocusedCard = (e) => {
    const swiper = swiperRef.current;
    const slide = e.target.closest('.swiper-slide');
    if (!swiper || swiper.destroyed || !slide || !e.target.matches(':focus-visible')) return;
    const card = slide.getBoundingClientRect();
    const track = swiper.el.getBoundingClientRect();
    if (card.left < track.left - 1 || card.right > track.right + 1) {
      swiper.slideToLoop(Number(slide.dataset.swiperSlideIndex), 0);
    }
  };

  return (
    <section className="overflow-x-clip px-5 sm:px-8">
      <Shell>
        <motion.div {...inView}>
          <SectionHeading>Art in real life</SectionHeading>
        </motion.div>
      </Shell>

      {/* The track: its left padding repeats Shell's centring offset so the
          first card lines up with the column, and the negative right margin
          cancels the section padding so it runs to the viewport's edge. */}
      <motion.div
        {...inView}
        className="-mr-5 mt-6 pl-[max(0px,calc((100%-1200px)/2))] sm:-mr-8 sm:mt-7 lg:mt-[31.18px]"
      >
        <div className="relative" onFocus={revealFocusedCard}>
          {/* Both arrows come first in the DOM so the tab order reaches them
              before the cards. Previous: 25px in from the track's left edge
              (over the first card), at every width. */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => swiperRef.current?.slidePrev()}
            className={`${ARROW} left-[25px]`}
          >
            <img src={nextCircle} alt="" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1" />
            <img src={nextChevron} alt="" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 rotate-180" />
          </button>

          {/* Next: 1239px into the track at 1440 and up (on the fifth card).
              Where the track is narrower than 1320px it stays 25px inside the
              viewport's right edge instead, as at 1440, so it's always on
              screen. */}
          <button
            type="button"
            aria-label="Next"
            onClick={() => swiperRef.current?.slideNext()}
            className={`${ARROW} left-[min(1239px,calc(100%-81px))]`}
          >
            <img src={nextCircle} alt="" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1" />
            <img src={nextChevron} alt="" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1" />
          </button>

          {/* overflow: clip rather than Swiper's overflow: hidden, which the
              browser can still scroll (e.g. to show a focused card) behind
              Swiper's back and knock the track out of line. */}
          <Swiper
            className="!overflow-clip"
            slidesPerView="auto"
            spaceBetween={20}
            breakpoints={{ 768: { spaceBetween: 30 } }}
            loop
            speed={500}
            grabCursor
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {SLIDES.map(({ key, ...reel }) => (
              <SwiperSlide key={key} className="!w-[220px] md:!w-[277.5px]">
                <ReelCard
                  {...reel}
                  formatPrice={formatPrice}
                  unmuted={unmutedKey === key}
                  onToggleSound={() => toggleSound(key)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </motion.div>
    </section>
  );
}
