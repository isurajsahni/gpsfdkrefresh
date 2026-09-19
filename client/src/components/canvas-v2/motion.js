/* Shared reveal animation for the Canvas Page v2 sections. */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* Spread onto a motion element to fade it up once it scrolls into view. */
export const inView = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.15 },
  variants: fadeUp,
};

/* Parent variant for lists whose children use `fadeUp`. */
export const stagger = (step = 0.05) => ({ show: { transition: { staggerChildren: step } } });
