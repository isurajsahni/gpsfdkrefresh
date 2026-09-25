/**
 * Where a category's landing page lives. Wall Canvas is the odd one out: its
 * landing page is /canvas, and /wall-canvas only redirects there. Its
 * collections keep their /wall-canvas/<collection> URLs.
 */
export const CANVAS_PATH = '/canvas';

export const categoryPath = (slug) => (slug === 'wall-canvas' ? CANVAS_PATH : `/${slug}`);
