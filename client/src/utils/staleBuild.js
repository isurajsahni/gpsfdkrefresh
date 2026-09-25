/**
 * Recovering from a deploy that happened while the site was open.
 *
 * Pages are split into their own files, named by content hash. A deploy
 * replaces them, so a tab still running the previous build fails to load the
 * next page it opens (Checkout, Login, …). Reloading picks up the new build.
 */

const RELOADED_AT_KEY = 'stale-build-reloaded-at';
const MIN_RELOAD_GAP_MS = 60 * 1000;

// Chrome/Edge, Safari and Firefox word the failure differently; the last one
// is Vite's own when a page's stylesheet is missing.
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

export const isChunkLoadError = (error) => CHUNK_ERROR.test(error?.message || '');

/**
 * Reload to fetch the current build — at most once a minute, so a file that
 * is genuinely missing can't put the page in a reload loop.
 * @returns {boolean} whether a reload was started
 */
export const reloadForNewBuild = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT_KEY)) || 0;
    if (Date.now() - last < MIN_RELOAD_GAP_MS) return false;
    sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    // Without storage there's no loop guard, so leave it to the error screen
    return false;
  }
  window.location.reload();
  return true;
};
