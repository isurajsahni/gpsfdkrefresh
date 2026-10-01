import { ALL_PRODUCTS_SLUG, collectionPath } from '../../utils/collections';

import inkAndInterval from '../../assets/image/canvas-v2/styles/ink-and-interval.png';
import sassyClassic from '../../assets/image/canvas-v2/styles/sassy-classic.png';
import botanicalMuse from '../../assets/image/canvas-v2/styles/botanical-muse.png';
import tetheredHorizons from '../../assets/image/canvas-v2/styles/tethered-horizons.png';
import gazeOfPower from '../../assets/image/canvas-v2/styles/gaze-of-power.png';
import wildEccentrics from '../../assets/image/canvas-v2/styles/wild-eccentrics.png';
import modernLegend from '../../assets/image/canvas-v2/styles/modern-legend.png';
import nostalgiaNoir from '../../assets/image/canvas-v2/styles/nostalgia-noir.png';
import millionaireArt from '../../assets/image/canvas-v2/styles/millionaire-art.png';
import gildedBloom from '../../assets/image/canvas-v2/styles/gilded-bloom.png';
import velocitySuite from '../../assets/image/canvas-v2/styles/velocity-suite.png';
import afterHourSuite from '../../assets/image/canvas-v2/styles/after-hour-suite.png';
import celestialFrontier from '../../assets/image/canvas-v2/styles/celestial-frontier.png';
import etherealGaze from '../../assets/image/canvas-v2/styles/ethereal-gaze.png';
import customCanvas from '../../assets/image/canvas-v2/styles/custom-canvas.jpg';

/* The art styles, in the "Find your art style" frame's order. Shared by that
   section on /canvas and the collection picker on the /wall-canvas listings.

   Every style is a collection of the Wall Canvas category, so a circle opens
   that collection's listing at /wall-canvas/<slug>. `collection` is the
   catalogue's own name for it — the frame's label isn't always the same ("The
   Millionaire Art" is filed as "Millionaire Art") — and it's slugged with the
   same rule CategoryPage matches the URL against, so the two can't drift apart.

   Label lines as the frame breaks them. The frame spells it "Glided"; the
   catalogue collection is "Gilded". Custom Canvas isn't in the frame: it
   follows the fourteen styles, links to the customiser rather than a
   collection, and its thumbnail is the printed photo from the home page's
   customise shot (square, so the circle clip rounds it). */
const style = (image, lines, collection, extra) => ({ image, lines, collection, to: collectionPath(collection), ...extra });

export const ART_STYLES = [
  style(inkAndInterval, ['Ink &', 'Interval'], 'Ink & Interval'),
  style(sassyClassic, ['The Sassy', 'Classic'], 'The Sassy Classic'),
  style(botanicalMuse, ['The Botanical', 'Muse'], 'The Botanical Muse'),
  // The frame turns this thumbnail -90°.
  style(tetheredHorizons, ['Tethered', 'Horizons'], 'Tethered Horizons', { rotated: true }),
  style(gazeOfPower, ['The Gaze', 'Of Power'], 'The Gaze of Power'),
  style(wildEccentrics, ['The Wild', 'Eccentrics'], 'The Wild Eccentrics'),
  style(modernLegend, ['The Modern', 'Legend'], 'The Modern Legend'),
  style(nostalgiaNoir, ['Nostalgia', 'Noir'], 'Nostalgia Noir'),
  style(millionaireArt, ['The', 'Millionaire Art'], 'Millionaire Art'),
  style(gildedBloom, ['The Gilded', 'Bloom'], 'The Gilded Bloom'),
  style(velocitySuite, ['The Velocity', 'Suite'], 'The Velocity Suite'),
  style(afterHourSuite, ['The After Hour', 'Suite'], 'The After Hour Suite'),
  style(celestialFrontier, ['The Celestial', 'Frontier'], 'The Celestial Frontier'),
  style(etherealGaze, ['The Ethereal', 'Gaze'], 'The Ethereal Gaze'),
  { image: customCanvas, lines: ['Custom', 'Canvas'], to: '/customize-canvas' },
];

/* /wall-canvas/all, which the listings put ahead of the styles. It has no
   thumbnail of its own, so its circle is a mosaic of four styles' thumbnails. */
export const ALL_PRODUCTS_STYLE = {
  mosaic: [sassyClassic, botanicalMuse, wildEccentrics, velocitySuite],
  lines: ['All', 'Products'],
  to: `/wall-canvas/${ALL_PRODUCTS_SLUG}`,
};
