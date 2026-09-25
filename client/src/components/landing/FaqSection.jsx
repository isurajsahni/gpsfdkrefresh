import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import Lines from './Lines';
import { CONTACT, fireContactPixel } from '../../utils/contactChannels';

import faqToggleCircle from '../../assets/image/landing/faq-toggle-circle.svg';
import chevronDownIcon from '../../assets/image/landing/chevron-down.svg';

/* ───────────────────────────────────────────────────────────────────────────
   FAQ section shared by the Consultancy v2 and Canvas Page v2 demos. The
   Canvas Page Figma file (figma.com/design/7gCw9F9RUAYrudmzJtsHWM) lays the
   FAQ out identically on both frames, and every size, colour and gap below is
   read from its layers, not estimated.

   - heading           ReactNode rendered inside the <h2>.
   - headingClassName  The heading's text colour, appended to the h2's classes.
   - items             [{ q, a }]; `a` is a string, or the Figma layer's lines
                       as an array (see <Lines>).
   - defaultOpen       Index of the item open on first render; -1 for none.
   - className         Appended to the section's classes. The section has no
                       top margin of its own, so each page sets the gap above.
   ─────────────────────────────────────────────────────────────────────────── */

/* Both gradients come straight from Figma; the angles differ only because the
   open item is taller than the closed ones. */
const FAQ_BG_OPEN = 'linear-gradient(203.56deg, rgba(241, 90, 41, 0.16) 0%, rgba(241, 90, 41, 0.01) 100%)';
const FAQ_BG_CLOSED = 'linear-gradient(197.3deg, rgba(241, 90, 41, 0.16) 0%, rgba(241, 90, 41, 0.01) 100%)';
const QUESTION_CARD_BG = 'linear-gradient(238.25deg, rgba(241, 90, 41, 0.04) 0%, rgba(241, 90, 41, 0.12) 100%)';

/* The landing pages' fade-up, played once as a block scrolls into view. */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* Opening and closing share one curve, so the card's padding, the answer's
   height and the chevron all move together. */
const EASE = 'duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]';

const inView = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.15 },
  variants: fadeUp,
};

function FaqItem({ q, a, open, onToggle }) {
  const answerId = useId();

  return (
    // Open: 15.6 / 20.4 top/bottom and 30px (not 20) before the next card, as
    // the frame has it — mb-10 on top of the list's 20px flex gap (flex gaps
    // and margins add; they don't collapse). Closed: the question centres in
    // the 80px row.
    <li
      className={`relative flex min-h-[80px] items-center gap-6 rounded-[10px] pl-5 pr-5 transition-[padding,margin] ${EASE} sm:gap-10 sm:pl-[25px] sm:pr-[40px] ${
        open ? 'mb-[10px] pb-[20.4px] pt-[15.6px] last:mb-0' : 'py-[18px]'
      }`}
      style={{ backgroundImage: open ? FAQ_BG_OPEN : FAQ_BG_CLOSED }}
    >
      <div className="min-w-0 flex-1">
        <h3>
          {/* Stretched over the whole row so the entire card toggles. Block,
              so the h3's own 1.5 line box doesn't pad the 1.19 question line
              (it made the open card ~1px taller than the frame's 112). */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={answerId}
            className="block text-left text-[16px] font-medium leading-[1.19] text-black after:absolute after:inset-0 after:rounded-[10px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent sm:text-[18px]"
          >
            {q}
          </button>
        </h3>
        {/* Animates to the answer's real height: the grid row eases between
            0fr and 1fr, and overflow-hidden lets it collapse to nothing.
            `invisible` (applied once closing ends) keeps a closed answer out
            of screen readers, as `hidden` used to. */}
        <div
          id={answerId}
          className={`grid transition-[grid-template-rows,opacity,visibility] ${EASE} ${
            open ? 'visible grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <p className="relative max-w-[557px] pt-[11.5px] text-[16px] leading-[1.19] text-[#595959] sm:text-[18px]">
              <Lines lines={a} />
            </p>
          </div>
        </div>
      </div>

      {/* pointer-events-none so a click on the circle falls through to the
          stretched button underneath. */}
      <span aria-hidden="true" className="pointer-events-none relative size-[30px] shrink-0">
        <img src={faqToggleCircle} alt="" className="absolute inset-0" />
        <img
          src={chevronDownIcon}
          alt=""
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform ${EASE} ${open ? 'rotate-180' : ''}`}
        />
      </span>
    </li>
  );
}

export default function FaqSection({ heading, headingClassName = 'text-[#353535]', items, defaultOpen = 0, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`px-5 sm:px-8 ${className}`}>
      {/* Desktop: heading and the question card share the left column (card at
          the bottom), questions on the right. Phones read heading → questions
          → card. The grid is the 1200px content column — the frame's 120px
          gutters at 1440. */}
      <div className="mx-auto w-full max-w-[1200px] grid gap-8 lg:grid-cols-[minmax(0,430fr)_minmax(0,692fr)] lg:grid-rows-[auto_1fr] lg:gap-x-[78px] lg:gap-y-10">
        {/* CSS `line-height: normal` on purpose (Tailwind's leading-normal is
            1.5): Figma leaves this one at "auto", so each line takes its own
            font's line height (a Garamond line comes out taller). */}
        <motion.h2
          {...inView}
          className={`text-[32px] font-medium leading-[normal] sm:text-[40px] lg:col-start-1 lg:row-start-1 lg:text-[48px] ${headingClassName}`}
        >
          {heading}
        </motion.h2>

        {/* 12px down so the first card's top lines up with the heading's cap
            height rather than its line box. */}
        <ul className="flex flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-[12px]">
          {items.map((item, i) => (
            <FaqItem key={item.q} {...item} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </ul>

        <motion.div
          {...inView}
          className="w-full rounded-[10px] px-5 pb-[30px] pt-6 sm:px-[25px] lg:col-start-1 lg:row-start-2 lg:mb-1 lg:self-end"
          style={{ backgroundImage: QUESTION_CARD_BG }}
        >
          <p className="text-[22px] font-medium leading-[1.19] text-black sm:text-[25px]">Still have a question ?</p>
          <p className="mt-[15px] max-w-[375px] text-[16px] leading-[1.19] text-[#595959] sm:text-[18px]">
            Can&rsquo;t find the answer to you questions?
            <br />
            <Lines lines={['Send us an email and we’ll get back to you', 'as soon as possible !']} />
          </p>
          <a
            href={`mailto:${CONTACT.email}`}
            onClick={() => fireContactPixel('Email')}
            className="mt-[45px] inline-flex h-[50px] w-[134px] items-center justify-center rounded-[40px] bg-accent text-[16px] text-white transition-colors duration-300 hover:bg-accent-dark"
          >
            Send Email
          </a>
        </motion.div>
      </div>
    </section>
  );
}
