// Where a visit came from, for the admin analytics. Pure functions: used when
// a page view is recorded (analyticsController.trackPageView) and again when
// the dashboard reads stored page views, so older rows are labelled by the
// same rules as new ones.
//
// Order: UTM tags (set by your own links and ads) win, then ad click IDs,
// then the referring site, then Facebook/Instagram's click ID, else Direct.

const SITE_HOSTS = /(^|\.)gpsfdk\.com$/;

// utm_source values as people actually write them → one label
const UTM_SOURCES = [
  [/^(ig|insta|instagram)/, 'Instagram'],
  [/^(fb|facebook|meta)/, 'Facebook'],
  [/^(google|adwords|gads|gclid)/, 'Google'],
  [/^(youtube|yt)/, 'YouTube'],
  [/^(twitter|x$|x\.com)/, 'Twitter/X'],
  [/^(whatsapp|wa$)/, 'WhatsApp'],
  [/^(pinterest|pin)/, 'Pinterest'],
  [/^(linkedin)/, 'LinkedIn'],
  [/^(bing)/, 'Bing'],
  [/^(chatgpt|openai)/, 'ChatGPT'],
  [/(email|newsletter|mail)/, 'Email'],
];

// Referring hostname (without "www.") → label. First match wins, so the
// specific Google hosts come before the general Google rule.
const REFERRER_HOSTS = [
  [/^(mail\.google\.com|outlook\.(live|office|office365)\.com|mail\.yahoo\.com)$/, 'Email'],
  [/^gemini\.google\.com$/, 'Gemini'],
  [/(^|\.)google\.[a-z.]+$/, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)yahoo\.[a-z.]+$/, 'Yahoo'],
  [/(^|\.)(yandex\.[a-z.]+|ecosia\.org|baidu\.com)$/, 'Other search'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, 'Facebook'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/^(t\.co|twitter\.com|x\.com|mobile\.twitter\.com)$/, 'Twitter/X'],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'WhatsApp'],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, 'Pinterest'],
  [/(^|\.)reddit\.com$/, 'Reddit'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
  [/(^|\.)(t\.me|telegram\.org)$/, 'Telegram'],
  [/(^|\.)(chatgpt\.com|chat\.openai\.com)$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity'],
  [/(^|\.)claude\.ai$/, 'Claude'],
  [/(^|\.)copilot\.microsoft\.com$/, 'Copilot'],
];

// Android apps open links with an android-app:// referrer
const APP_REFERRERS = [
  [/^com\.google\.android\.gm$/, 'Email'],
  [/^com\.google\.android\.(googlequicksearchbox|gms)/, 'Google'],
  [/^com\.instagram\./, 'Instagram'],
  [/^com\.facebook\./, 'Facebook'],
  [/^com\.whatsapp/, 'WhatsApp'],
  [/^com\.linkedin\./, 'LinkedIn'],
  [/^com\.pinterest/, 'Pinterest'],
];

// "https://www.google.co.in/search?q=…" → "google.co.in"; '' if not a URL
const referrerHost = (referrer) => {
  try {
    const url = new URL(referrer);
    return url.protocol === 'android-app:' ? '' : url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

const fromReferrer = (referrer) => {
  if (!referrer) return null;
  const app = /^android-app:\/\/([^/]+)/i.exec(referrer);
  if (app) return (APP_REFERRERS.find(([re]) => re.test(app[1].toLowerCase())) || [null, 'Other'])[1];
  const host = referrerHost(referrer);
  if (!host) return null;
  // Arriving from one of our own pages (a new tab, a reload) isn't a source
  if (SITE_HOSTS.test(host)) return null;
  return (REFERRER_HOSTS.find(([re]) => re.test(host)) || [null, 'Other'])[1];
};

const fromUtm = (utmSource) => {
  const src = String(utmSource || '').trim().toLowerCase();
  if (!src) return null;
  const known = UTM_SOURCES.find(([re]) => re.test(src));
  // Unrecognised tags keep their own name, as typed
  return known ? known[1] : String(utmSource).trim();
};

// clickSource: which ad click ID the landing URL carried, if any
// ('gclid' | 'fbclid' | 'msclkid'), sent by the site with each page view
const detectSource = ({ utmSource, referrer, clickSource } = {}) =>
  fromUtm(utmSource) ||
  (clickSource === 'gclid' && 'Google Ads') ||
  (clickSource === 'msclkid' && 'Bing Ads') ||
  fromReferrer(referrer) ||
  (clickSource === 'fbclid' && 'Facebook/Instagram') ||
  'Direct';

// Source of a stored page view: recomputed from its UTM tag and referrer by
// today's rules (older rows were labelled by older ones). Click IDs aren't
// stored on their own, so a label that came from one is kept where
// detectSource would have chosen it: ad clicks over the referrer, Meta's
// click ID only when nothing else says where the visit came from.
const storedViewSource = ({ utmSource, referrer, source }) => {
  if (!utmSource && (source === 'Google Ads' || source === 'Bing Ads')) return source;
  const recomputed = detectSource({ utmSource, referrer });
  return recomputed === 'Direct' && source === 'Facebook/Instagram' ? source : recomputed;
};

module.exports = { detectSource, storedViewSource, referrerHost, SITE_HOSTS };
