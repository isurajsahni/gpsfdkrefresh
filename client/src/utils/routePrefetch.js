/**
 * Fetching pages before they're clicked.
 *
 * Every page is its own file, downloaded the first time it's opened. React
 * Router renders the new page in a transition, so until that file arrives the
 * old page stays on screen with only the URL changed. The files are tiny, but
 * the first request for one after a deploy can miss Vercel's edge cache and
 * take seconds, which looks like the link is broken.
 *
 * So fetch ahead: the purchase path's pages (category, product, cart,
 * checkout) once the first page has loaded, and any other page only when the
 * pointer, keyboard focus or a finger lands on a link to it. Warming every
 * header and footer link on load made the homepage download nearly every
 * page's file (About, Blog, policies...) whether or not anyone opened them.
 */
import { lazy, isValidElement, Children } from 'react';
import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import { loadInBackground } from './staleBuild';

/** React.lazy, plus `preload()` to fetch the page without rendering it */
export const lazyPage = (load) => {
  let pending;
  const preload = () => {
    pending ??= load().catch((error) => {
      // Let the next attempt (the click) try again
      pending = undefined;
      throw error;
    });
    return pending;
  };
  return Object.assign(lazy(preload), { preload });
};

const preload = (Page) =>
  loadInBackground(Page.preload).catch(() => {
    // Best-effort: the click fetches it again and handles any failure
  });

// The lazy pages in a route's element, e.g. <><Love /><Footer /></>
const pagesIn = (node, found = []) => {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    if (child.type?.preload) found.push(child.type);
    if (child.props.children) pagesIn(child.props.children, found);
  });
  return found;
};

const saveData = () => {
  const connection = navigator.connection;
  return Boolean(connection?.saveData || /2g/.test(connection?.effectiveType || ''));
};

/**
 * @param routeElements the <Route>s the app renders
 * @param warm pages to fetch once the first page has loaded
 * @returns cleanup
 */
export function startRoutePrefetch(routeElements, { warm = [] } = {}) {
  const routes = createRoutesFromChildren(routeElements);
  const done = new Set();

  const prefetchHref = (href) => {
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin || done.has(url.pathname)) return;
    done.add(url.pathname);
    for (const { route } of matchRoutes(routes, url.pathname) || []) {
      pagesIn(route.element).forEach(preload);
    }
  };

  const onIntent = (event) => {
    const link = event.target.closest?.('a[href]');
    if (link && !link.target && !link.hasAttribute('download')) prefetchHref(link.href);
  };
  document.addEventListener('pointerover', onIntent, { passive: true });
  document.addEventListener('focusin', onIntent);
  document.addEventListener('touchstart', onIntent, { passive: true });

  // The purchase path's pages, after the first page's own files and images
  // are in. Phones have no hover to go on, so this is what makes a tap on a
  // product, the cart or checkout instant there.
  const idleHandles = new Set();
  const whenIdle = (cb) => {
    const request = window.requestIdleCallback || ((fn) => setTimeout(fn, 1000));
    const handle = request(() => {
      idleHandles.delete(handle);
      cb();
    }, { timeout: 3000 });
    idleHandles.add(handle);
  };
  const warmUp = () => whenIdle(() => {
    if (saveData()) return;
    warm.forEach(preload);
  });
  if (document.readyState === 'complete') warmUp();
  else window.addEventListener('load', warmUp, { once: true });

  return () => {
    document.removeEventListener('pointerover', onIntent);
    document.removeEventListener('focusin', onIntent);
    document.removeEventListener('touchstart', onIntent);
    window.removeEventListener('load', warmUp);
    idleHandles.forEach((handle) => (window.cancelIdleCallback || clearTimeout)(handle));
  };
}
