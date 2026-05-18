// Client-side helpers for Meta Pixel + Conversions API deduplication.
//
// Every browser-side pixel event we want to dedupe with a server-side CAPI
// event must share a unique `event_id`. Pass it through as the 4th arg to
// `fbq('track', name, data, { eventID })` AND in the request body to the
// server, which forwards it to CAPI.
//
// fbp / fbc are first-party cookies set by the Meta Pixel script. CAPI uses
// them for browser↔server identity matching. Read them on the client and
// forward to the server in the same request.

const newEventId = () => {
  // crypto.randomUUID is available in all modern browsers and Node 19+.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers — random-enough for dedup purposes.
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const readCookie = (name) => {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
};

// _fbp = Meta's first-party browser pixel cookie (set by the pixel script).
// _fbc = click ID cookie. Synthesized from ?fbclid= if not yet set so we
//        still report ad-click attribution even on the first page view.
const getFbCookies = () => {
  const fbp = readCookie('_fbp');
  let fbc = readCookie('_fbc');
  if (!fbc && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }
  }
  return { fbp, fbc };
};

// Fire a pixel event with an event_id for CAPI deduplication.
// Returns the event_id so the caller can also send it to the server.
const trackPixel = (eventName, data = {}) => {
  const eventId = newEventId();
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, data, { eventID: eventId });
  }
  return eventId;
};

export { newEventId, getFbCookies, trackPixel };
