import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Shell, SectionHeading } from './Layout';
import { inView } from './motion';

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
   on the cards. The frame has no previous button; ours mirrors the next one,
   25px in from the track's left edge as the next is from its right at 1440. */

const REELS = [
  { name: 'Feline Preference', slug: 'feline-preference', src: felinePreference },
  { name: 'Dreaming in Colors', slug: 'dreaming-in-colors', src: dreamingInColors },
  { name: 'Palm Springs Prowl', slug: 'palm-springs-prowl', src: palmSpringsProwl },
  { name: 'The Sentinel', slug: 'the-sentinel', src: theSentinel },
  { name: 'Bubblegum Rebellion', slug: 'bubblegum-rebellion', src: bubblegumRebellion },
  { name: 'The Wolf of Wall Street', slug: 'the-wolf-of-wall-street', src: wolfOfWallStreet },
];

/* Swiper's loop needs at least one more slide than fits in the track. A 3440px
   ultrawide fits nine of these cards, so the six reels go round twice. */
const SLIDES = [0, 1].flatMap((copy) => REELS.map((reel) => ({ ...reel, key: `${reel.slug}-${copy}` })));

const ARROW =
  'absolute top-[calc(50%-28px)] z-10 grid size-14 place-items-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2';

function ReelCard({ name, slug, src }) {
  const videoRef = useRef(null);

  // Play only while on screen, as VideoShowcase does: with preload="metadata"
  // a clip downloads once it scrolls or slides into view, and cards clipped
  // off either end of the track stay paused.
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

  return (
    // draggable={false}: otherwise a mouse drag picks up the link itself and
    // the browser cancels Swiper's swipe. The focus ring is drawn inside the
    // card (on ::after, above the video) because the track clips anything
    // outside it.
    <Link
      to={`/product/${slug}`}
      aria-label={name}
      draggable={false}
      className="relative isolate block h-[357px] overflow-hidden rounded-[20px] bg-[#d9d9d9] after:pointer-events-none after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-inset focus-visible:after:ring-accent md:h-[450px]"
    >
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
    </Link>
  );
}

export default function ArtInRealLife() {
  const swiperRef = useRef(null);

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
                <ReelCard {...reel} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </motion.div>
    </section>
  );
}
