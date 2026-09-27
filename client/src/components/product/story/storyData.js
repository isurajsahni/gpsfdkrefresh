/* Content and derived data for the product page's story (the section under
   the buy box). Product claims here are ones the site already makes: the FAQ
   page (350 GSM canvas, eco-solvent inks, rolled or stretched over a wooden
   frame), the poster and nameplate specs the product page has always listed
   (5 mm sunboard, 120 GSM vinyl, 300 GSM paper; acrylic base, matte vinyl,
   box contents, nameplate care), and the shipping and returns policy pages.
   Keep them in step if any of those change. The canvas care tips are general
   advice for canvas prints rather than product claims. */

import { COLLECTIONS } from '../../../utils/collections';
import { isNameplateProduct } from '../../../utils/nameplate';
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE } from '../../../utils/shipping';

export const clean = (value) => (value || '').trim();
const lower = (value) => clean(value).toLowerCase();
const uniq = (values) => [...new Set(values)];
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// "a, b or c"
export const joinList = (items, word = 'and') =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;

export const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export const storyKind = (product) => {
  if (isNameplateProduct(product)) return 'nameplate';
  if (product.category?.slug === 'wall-canvas') return 'canvas';
  return 'generic';
};

export const collectionOf = (product) => {
  const name = clean(product.subCategory);
  return COLLECTIONS.includes(name) ? name : '';
};

/* ── Images ───────────────────────────────────────────────────────────────────
   The catalogue's convention: images[0] is the lifestyle shot (the canvas in a
   room, the nameplate by a front door) and images[1] the artwork or design on
   its own. Canvases uploaded with only the room shot get a content-aware crop
   of it instead, which Cloudinary centres on the artwork hanging in the room.
   c_thumb with a little zoom crops closest to the canvas's edges; c_fill keeps
   a band of wall, and c_auto sometimes settles on the bed instead. It isn't
   perfect (a room with a striking sofa can win), so uploading the artwork as
   the second image is always better. */

const cloudinaryTransform = (url, transform) => {
  if (!url?.includes('res.cloudinary.com') || !url.includes('/upload/')) return '';
  const [base, rest] = url.split('/upload/');
  // Chain after any transformation already in the URL, as optimizeImage does
  const versioned = /^(.*?\/)?(v\d+\/.*)$/.exec(rest);
  if (versioned && versioned[1]) return `${base}/upload/${versioned[1]}${transform}/${versioned[2]}`;
  return `${base}/upload/${transform}/${rest}`;
};

export const artworkSource = (product, kind) => {
  const own = product.images?.[1]?.url;
  // Nameplate designs sit on a white backdrop: trimmed, the image is the
  // plate itself, at its real proportions
  if (own && kind === 'nameplate') {
    return { url: cloudinaryTransform(own, 'e_trim:10/f_auto,q_auto,w_800,c_limit') || own, cropped: false };
  }
  if (own) return { url: cloudinaryTransform(own, 'f_auto,q_auto,w_1200,c_limit') || own, cropped: false };
  const room = product.images?.[0]?.url;
  const crop = cloudinaryTransform(room, 'c_thumb,g_auto,ar_2:1,z_1.3,w_1000,f_auto,q_auto');
  return crop ? { url: crop, cropped: true } : { url: '', cropped: false };
};

/* ── Finishes ─────────────────────────────────────────────────────────────── */

const FINISHES = {
  'canvas|stretched': {
    kind: 'stretched',
    name: 'Stretched canvas',
    short: 'stretched',
    tagline: 'Gallery-wrapped over a wooden frame. It arrives ready to hang.',
    specs: ['350 GSM canvas', 'Eco-solvent inks', 'Wooden frame', 'Ready to hang'],
    bestFor: 'Living rooms, bedrooms and statement walls',
  },
  'canvas|rolled': {
    kind: 'rolled',
    name: 'Rolled canvas',
    short: 'rolled',
    tagline: 'The same 350 GSM canvas, shipped rolled, so you can frame it your way.',
    specs: ['350 GSM canvas', 'Eco-solvent inks', 'Ships rolled, unframed'],
    bestFor: 'Framing to your own taste',
  },
  'poster|soft board': {
    kind: 'softboard',
    name: 'Soft board poster',
    short: 'soft board',
    tagline: 'Mounted on 5 mm sunboard: light, rigid and easy to put up.',
    specs: ['5 mm sunboard', 'Lightweight and sturdy', 'Easy to mount'],
    bestFor: 'Home offices, study rooms and presentations',
  },
  'poster|sticker': {
    kind: 'sticker',
    name: 'Sticker poster',
    short: 'sticker',
    tagline: '120 GSM self-adhesive vinyl. Peel, stick, done.',
    specs: ['120 GSM vinyl', 'Self-adhesive', 'Peel and stick'],
    bestFor: 'Glass and other smooth surfaces, signage',
  },
  'poster|paper': {
    kind: 'paper',
    name: 'Paper poster',
    short: 'paper',
    tagline: '300 GSM premium paper with a matte finish.',
    specs: ['300 GSM paper', 'Matte finish'],
    bestFor: 'Wall posters, events and décor',
  },
};

const FINISH_ORDER = ['stretched', 'rolled', 'softboard', 'sticker', 'paper', 'generic'];

// Materials carry stray spaces in the catalogue (" Canvas"), so match trimmed
// and lower-cased — but keep the raw values to pick the variation with.
export const finishKey = (variation) => `${lower(variation?.material)}|${lower(variation?.frame)}`;

export const getFinishes = (variations = []) => {
  const byKey = new Map();
  for (const variation of variations) {
    if (!clean(variation.material) && !clean(variation.frame)) continue;
    const key = finishKey(variation);
    let finish = byKey.get(key);
    if (!finish) {
      const label = [clean(variation.frame), lower(variation.material)].filter(Boolean).join(' ');
      const copy = FINISHES[key] || {
        kind: 'generic',
        name: capitalize(label),
        short: label.toLowerCase(),
        tagline: '',
        specs: [],
        bestFor: '',
      };
      finish = { ...copy, key, material: variation.material, frame: variation.frame, minPrice: 0, sizes: [] };
      byKey.set(key, finish);
    }
    if (variation.price > 0 && (!finish.minPrice || variation.price < finish.minPrice)) finish.minPrice = variation.price;
    if (!finish.sizes.includes(variation.size)) finish.sizes.push(variation.size);
  }
  return [...byKey.values()].sort((a, b) => FINISH_ORDER.indexOf(a.kind) - FINISH_ORDER.indexOf(b.kind));
};

const isCanvasFinish = (finish) => finish.kind === 'stretched' || finish.kind === 'rolled';
const isPosterFinish = (finish) => ['softboard', 'sticker', 'paper'].includes(finish.kind);

/* ── Sizes ────────────────────────────────────────────────────────────────── */

// ISO 216 paper sizes in inches, short side first
const PAPER_SIZES = {
  A5: [5.83, 8.27], A4: [8.27, 11.69], A3: [11.69, 16.54], A2: [16.54, 23.39], A1: [23.39, 33.11], A0: [33.11, 46.81],
};
const INCH_SIZE = /^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(?:in(?:ch(?:es)?)?|")?$/i;

// { long, short } in inches, or null for sizes we can't draw ("Custom Size")
export const parseSize = (size) => {
  const text = clean(size);
  const inch = INCH_SIZE.exec(text);
  if (inch) {
    const a = Number(inch[1]);
    const b = Number(inch[2]);
    return { long: Math.max(a, b), short: Math.min(a, b) };
  }
  const paper = PAPER_SIZES[text.toUpperCase()];
  return paper ? { long: paper[1], short: paper[0] } : null;
};

// Width and height of a size hung in the given orientation
export const orient = ({ long, short }, orientation) =>
  orientation === 'portrait' ? { w: short, h: long } : { w: long, h: short };

export const isInchSize = (size) => INCH_SIZE.test(clean(size));

// "12x18" → "12 × 18", "15X8" → "15 × 8", "a4" → "A4"
export const sizeLabel = (size) => {
  const text = clean(size);
  const inch = INCH_SIZE.exec(text);
  if (inch) return `${inch[1]} × ${inch[2]}`;
  return PAPER_SIZES[text.toUpperCase()] ? text.toUpperCase() : text;
};

const area = (size) => {
  const dims = parseSize(size);
  return dims ? dims.long * dims.short : 0;
};

// "12 × 18 to 36 × 60 in" for inch sizes, "A4 or A3" for paper
export const sizeRange = (sizes, word = 'or') => {
  const sorted = uniq(sizes).sort((a, b) => area(a) - area(b));
  const inch = sorted.filter((s) => INCH_SIZE.test(clean(s)));
  const other = sorted.filter((s) => !INCH_SIZE.test(clean(s)));
  const parts = [];
  if (inch.length === 1) parts.push(`${sizeLabel(inch[0])} in`);
  if (inch.length === 2) parts.push(`${sizeLabel(inch[0])} ${word} ${sizeLabel(inch[1])} in`);
  if (inch.length > 2) parts.push(`${sizeLabel(inch[0])} to ${sizeLabel(inch[inch.length - 1])} in`);
  if (other.length > 0) parts.push(joinList(other.map(sizeLabel), word));
  return parts.join(', ');
};

// 24 → "24 in" / "61 cm"; one decimal at most
export const formatLength = (inches, unit) => {
  const value = unit === 'cm' ? inches * 2.54 : inches;
  return `${Math.round(value * 10) / 10} ${unit}`;
};

/* ── Copy ─────────────────────────────────────────────────────────────────── */

export const headlineFor = (kind) => ({
  canvas: 'Made to hold the room.',
  nameplate: 'The first thing every guest reads.',
  generic: 'Made for the way you live.',
})[kind];

// The lead paragraph, used when the admin hasn't written a description
export const leadFor = (product, kind, finishes) => {
  // The headline already names the product and the eyebrow its collection
  if (kind === 'nameplate') {
    return 'Made to order with your family name and house number: a smooth matte vinyl finish on a durable acrylic base, weather-resistant, lightweight and easy to install. Because everyone has the Right to Luxury.';
  }

  const parts = [];
  const canvas = finishes.filter(isCanvasFinish).map((f) => f.kind);
  if (canvas.length > 0) {
    const how = canvas.length === 2
      ? 'Order it rolled, or stretched over a wooden frame and ready to hang.'
      : canvas[0] === 'stretched'
        ? 'It arrives stretched over a wooden frame, ready to hang.'
        : 'It ships rolled, ready for the frame of your choice.';
    parts.push(`Printed with eco-solvent inks on heavyweight 350 GSM canvas. ${how}`);
  } else {
    parts.push('Printed and finished by GPSFDK.');
  }

  const posters = finishes.filter(isPosterFinish);
  if (posters.length > 0) {
    const ways = { softboard: 'mounted on soft board', sticker: 'as a peel-and-stick sticker', paper: 'on matte paper' };
    const sizes = sizeRange(posters.flatMap((f) => f.sizes));
    parts.push(`Prefer something lighter? It also comes as a poster${sizes ? ` in ${sizes}` : ''}, ${joinList(posters.map((f) => ways[f.kind]), 'or')}.`);
  }
  return parts.join(' ');
};

// Lines for the gallery label beside the hero artwork
export const labelFor = (product, kind, finishes) => {
  const sizes = (product.variations || []).map((v) => v.size);
  if (kind === 'nameplate') {
    const range = sizeRange(sizes);
    return {
      title: product.name,
      subtitle: 'House nameplate · GPSFDK',
      lines: ['Matte vinyl on a durable acrylic base', range ? `${range}, or a custom size` : 'Made to your size'],
    };
  }
  const canvas = finishes.filter(isCanvasFinish);
  const posters = finishes.filter(isPosterFinish);
  const collection = collectionOf(product);
  return {
    title: product.name,
    subtitle: [collection || (kind === 'canvas' ? 'Wall canvas' : product.category?.name), 'GPSFDK'].filter(Boolean).join(' · '),
    lines: [
      canvas.length > 0 && 'Eco-solvent inks on 350 GSM canvas',
      canvas.length > 0 && `Canvas, ${sizeRange(canvas.flatMap((f) => f.sizes))}`,
      posters.length > 0 && `Poster, ${sizeRange(posters.flatMap((f) => f.sizes))}`,
      canvas.length === 0 && posters.length === 0 && sizeRange(sizes),
    ].filter(Boolean),
  };
};

// The figures under the hero. `value` counts up when it's a number.
export const statsFor = (product, kind, finishes) => {
  const sizes = uniq((product.variations || []).map((v) => v.size).filter((s) => parseSize(s)));
  if (kind === 'nameplate') {
    return [
      { value: sizes.length, unit: sizes.length === 1 ? 'size + custom' : 'sizes + custom', label: sizeRange(sizes) || 'Made to your size' },
      { value: 3, unit: 'in the box', label: 'Nameplate, hanging kit and certificate' },
      { value: 'Acrylic', unit: 'base', label: 'Durable, with a matte vinyl finish' },
      { value: 'Outdoor', unit: 'ready', label: 'Weather-resistant and long-lasting' },
    ];
  }
  const canvas = finishes.filter(isCanvasFinish);
  return [
    canvas.length > 0 && { value: 350, unit: 'GSM', label: 'Heavyweight canvas' },
    sizes.length > 0 && { value: sizes.length, unit: sizes.length === 1 ? 'size' : 'sizes', label: sizeRange(sizes, 'and') },
    finishes.length > 0 && {
      value: finishes.length,
      unit: finishes.length === 1 ? 'finish' : 'finishes',
      label: capitalize(joinList(finishes.map((f) => f.short))),
    },
    { value: 7, unit: 'day returns', label: 'From the day it’s delivered' },
  ].filter(Boolean);
};

// The spec sheet: [term, detail] rows
export const specsFor = (product, kind, finishes) => {
  if (kind === 'nameplate') {
    const sizes = sizeRange((product.variations || []).map((v) => v.size));
    return [
      ['Base', 'Durable acrylic'],
      ['Finish', 'Matte vinyl, for a smooth, elegant look'],
      ['Built for', 'Outdoor walls: weather-resistant and long-lasting'],
      ['Fitting', 'Lightweight yet sturdy, and easy to install'],
      ['Sizes', `${sizes ? `${sizes}, or a custom size quoted for you. ` : ''}Sizes are approximate: the final shape follows the design.`],
      ['Personalised with', 'Your family name and house number'],
      ['In the box', 'Nameplate, hanging kit and GPS Family Certificate'],
      ['Brand', 'GPSFDK'],
    ];
  }

  const has = (k) => finishes.some((f) => f.kind === k);
  const canvas = finishes.filter(isCanvasFinish);
  const posters = finishes.filter(isPosterFinish);
  const collection = collectionOf(product);
  return [
    canvas.length > 0 && ['Canvas', '350 GSM, printed on industrial eco-solvent printers'],
    canvas.length > 0 && ['Inks', 'Eco-solvent: environment-friendly and long-lasting'],
    has('stretched') && ['Stretched', 'Gallery-wrapped over a wooden frame, ready to hang'],
    has('rolled') && ['Rolled', 'Unframed canvas, shipped rolled'],
    has('softboard') && ['Soft board', '5 mm sunboard: lightweight, sturdy and easy to mount'],
    has('sticker') && ['Sticker', '120 GSM self-adhesive vinyl sheet, peel and stick'],
    has('paper') && ['Paper', '300 GSM premium paper, matte finish'],
    canvas.length > 0 && ['Canvas sizes', sizeRange(canvas.flatMap((f) => f.sizes), 'and')],
    posters.length > 0 && ['Poster sizes', sizeRange(posters.flatMap((f) => f.sizes), 'and')],
    finishes.length === 0 && ['Sizes', sizeRange((product.variations || []).map((v) => v.size), 'and')],
    collection && ['Collection', collection],
    ['Brand', 'GPSFDK'],
  ].filter((row) => row && row[1]);
};

export const careFor = (kind) => (kind === 'nameplate'
  ? [
      { icon: 'cloth', title: 'A soft, damp cloth', text: 'Clean it directly with a soft, damp cloth.' },
      { icon: 'water', title: 'No washing', text: 'Avoid washing or rinsing it with water.' },
      { icon: 'chemicals', title: 'No harsh chemicals', text: 'Simply wipe gently for a long-lasting finish.' },
    ]
  : [
      { icon: 'dust', title: 'Dust, don’t scrub', text: 'A soft, dry cloth keeps the surface clean.' },
      { icon: 'sun', title: 'Mind the sun', text: 'Hang it away from harsh, direct sunlight to keep colours rich.' },
      { icon: 'damp', title: 'Keep it dry', text: 'Avoid damp walls, steam and moisture.' },
    ]);

export const BOX_CONTENTS = [
  { icon: 'plate', title: 'Your nameplate', text: '1 × value-packed vinyl nameplate, made to order' },
  { icon: 'kit', title: 'Hanging kit', text: '1 × kit for easy installation' },
  { icon: 'certificate', title: 'GPS Family Certificate', text: '1 × certificate, in every box' },
];

export const promisesFor = (kind) => [
  {
    icon: 'truck',
    title: `Free shipping over ₹${FREE_SHIPPING_THRESHOLD}`,
    text: `Within India. A flat ₹${FLAT_SHIPPING_FEE} below that.`,
    to: '/shipping-policy',
  },
  kind === 'nameplate'
    ? { icon: 'clock', title: 'Crafted in 3–5 days', text: 'Then delivered in 5–7 business days across India.', to: '/shipping-policy' }
    : { icon: 'clock', title: 'Dispatched in 1–2 days', text: 'Then delivered in 5–7 business days across India.', to: '/shipping-policy' },
  kind === 'nameplate'
    ? { icon: 'shield', title: 'Made right, or made again', text: 'Damaged, or a detail we got wrong? Free replacement or a full refund.', to: '/returns-refunds' }
    : { icon: 'returns', title: '7-day returns', text: 'And a free replacement or full refund if it arrives damaged.', to: '/returns-refunds' },
  { icon: 'globe', title: 'Ships worldwide', text: 'Prices in your currency, and tracking on every order.', to: '/shipping-policy' },
];

export const marqueeFor = (kind) => (kind === 'nameplate'
  ? ['Right to Luxury', 'Made to order', 'High durability', 'Premium finish']
  : ['Right to Luxury', 'Eco-friendly inks', 'High durability', 'Premium finish']);
