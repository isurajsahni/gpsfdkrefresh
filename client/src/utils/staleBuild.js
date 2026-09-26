/**
 * Recovering from a deploy that happened while the site was open.
 *
 * Pages are split into their own files, named by content hash. A deploy
 * replaces them, so a tab still running the previous build fails to load the
 * next page it opens (Checkout, Login, …). Reloading picks up the new build.
 */

const RELOADED_AT_KEY = 'stale-build-reloaded-at';
// Long enough to catch a file that's missing even after reloading (the page
// fails again within seconds of loading), short enough that two deploys
// in quick succession each get their own reload.
const MIN_RELOAD_GAP_MS = 10 * 1000;

// Set once a reload has started: the page is about to be replaced, so the
// error boundary shows "Updating…" rather than an error.
let reloading = false;
export const isReloadingForNewBuild = () => reloading;

// Chrome/Edge, Safari and Firefox word the failure differently; the last one
// is Vite's own when a page's stylesheet is missing.
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

export const isChunkLoadError = (error) => CHUNK_ERROR.test(error?.message || '');

/**
 * Reload to fetch the current build, at most once every few seconds, so a file
 * that is genuinely missing can't put the page in a reload loop.
 * @returns {boolean} whether a reload was started (or already is)
 */
export const reloadForNewBuild = () => {
  if (reloading) return true;
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT_KEY)) || 0;
    if (Date.now() - last < MIN_RELOAD_GAP_MS) return false;
    sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    // Without storage there's no loop guard, so leave it to the error screen
    return false;
  }
  reloading = true;
  window.location.reload();
  return true;
};
