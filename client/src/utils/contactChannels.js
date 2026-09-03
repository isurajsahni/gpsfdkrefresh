/**
 * Single source of truth for the public contact channels.
 *
 * The footer and the contact page both render these. Keeping one copy is what
 * stops the phone number from being updated in one place and going quietly
 * stale in the other — which is exactly the kind of drift nobody notices until
 * a customer calls a dead line.
 */
export const CONTACT = {
  email: 'support@gpsfdk.com',
  // Display and dial forms differ on purpose: the dial form has to stay
  // digits-only with the country code or tel:/wa.me links break.
  phoneDisplay: '+91 62803-10103',
  phoneDial: '+916280310103',
  whatsapp: 'https://wa.me/916280310103',
  instagram: 'https://www.instagram.com/canvas.gps/',
  instagramHandle: '@canvas.gps',
};

/** Fire the Meta Pixel Contact event once per channel click. */
export const fireContactPixel = (method) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Contact', { content_name: method });
    console.log(`[Meta Pixel] Contact event fired (${method})`);
  }
};
