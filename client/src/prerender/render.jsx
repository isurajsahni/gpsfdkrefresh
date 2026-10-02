/* eslint-disable react-refresh/only-export-components -- a build-time renderer, never hot-reloaded */
// Renders pages to HTML outside the browser, so their raw HTML carries the
// page's title, canonical, structured data and content without any JavaScript
// running. The browser shows that HTML until React renders the same page and
// SEO.jsx removes it.
//
// vite.prerender.plugin.js compiles this file for Node after the client build
// (to client/.prerender/render.mjs) and:
// - at build time, writes a page for each of prerenderPaths() (home, info,
//   location and blog pages);
// - api/render.js uses it per request for product and listing pages: it
//   fetches what catalogueRequests() lists from the API and passes the
//   results to render() as data.
//
// It renders the real page component with the app's providers; the page's own
// <SEO> supplies the head tags. Effects don't run here, so anything a page
// loads in an effect renders as its loading state, as it does in the browser
// before that data arrives; catalogue pages instead start from the data passed
// in (see PrerenderData.js).
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../context/AuthContext';
import { UIProvider } from '../context/UIContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { CartProvider } from '../context/CartContext';
import { LOCATION_DATA } from '../content/locations';
import { COLLECTIONS, collectionSlug, LISTING_PAGE_SIZE } from '../utils/collections';
import { PrerenderDataContext } from './PrerenderData';
import blogs from '../content/blogs/index';
import { BLOG_LIST_DESCRIPTION, sortByDate } from '../content/blogs/blogShared';
import StorePage from '../pages/StorePage';
import AboutUs from '../pages/info/AboutUs';
import CEOPage from '../pages/info/CEOPage';
import Vision from '../pages/info/Vision';
import Contact from '../pages/info/Contact';
import FAQ from '../pages/info/FAQ';
import ShippingPolicy from '../pages/support/ShippingPolicy';
import ReturnsRefunds from '../pages/support/ReturnsRefunds';
import PrivacyPolicy from '../pages/info/PrivacyPolicy';
import TermsConditions from '../pages/support/TermsConditions';
import Support from '../pages/info/Support';
import CustomizeCanvasPage from '../pages/CustomizeCanvasPage';
import SEO_PremiumWallCanvasIndia from '../pages/SEO_PremiumWallCanvasIndia';
import CanvasLandingV2 from '../pages/CanvasLandingV2';
import LocationPage from '../pages/LocationPage';
import BlogList from '../pages/BlogList';
import BlogPost from '../pages/BlogPost';
import ProductPage from '../pages/ProductPage';
import CategoryPage from '../pages/CategoryPage';

// Path → page, matching the routes in App.jsx. /contact is left out while its
// redesign is in progress. Each path also needs a rewrite in vercel.json to
// the file the plugin writes (dist/<path>/index.html; / is dist/index.html).
const PAGES = {
  '/': StorePage,
  '/about': AboutUs,
  '/ceo': CEOPage,
  '/vision': Vision,
  '/consultancy': Contact,
  '/faq': FAQ,
  '/shipping-policy': ShippingPolicy,
  '/returns-refunds': ReturnsRefunds,
  '/privacy-policy': PrivacyPolicy,
  '/terms-conditions': TermsConditions,
  '/support': Support,
  '/customize-canvas': CustomizeCanvasPage,
  '/premium-wall-canvas-india': SEO_PremiumWallCanvasIndia,
  '/canvas': CanvasLandingV2,
  '/blog': BlogList,
};

export const prerenderPaths = () => [
  ...Object.keys(PAGES),
  ...Object.keys(LOCATION_DATA).map((city) => `/location/${city}`),
  ...blogs.map((post) => `/blog/${post.slug}`),
];

// Newest first, for the RSS feed
export const blogPosts = () => sortByDate(blogs);
export { BLOG_LIST_DESCRIPTION };

// The API reads (all GET) a catalogue page makes when it loads, keyed by the
// name the page reads them under from PrerenderData. null: the URL isn't a page
// (unknown collection). `required` reads answering 404 mean the page doesn't
// exist. Mirrors the requests in ProductPage, CategoryPage and
// ProductZigzagPage.
export const catalogueRequests = (path, search = '') => {
  const product = /^\/product\/([a-z0-9-]+)$/.exec(path);
  if (product) return [{ key: 'product', url: `/products/${product[1]}`, required: true }];

  const collection = /^\/wall-canvas\/([a-z0-9-]+)$/.exec(path);
  if (collection) {
    const name = COLLECTIONS.find((c) => collectionSlug(c) === collection[1]);
    if (!name) return null;
    const page = Math.max(1, parseInt(new URLSearchParams(search).get('page') || '1', 10) || 1);
    return [
      { key: 'category', url: '/categories/wall-canvas', required: true },
      { key: 'listing', url: '/products', params: { categorySlug: 'wall-canvas', page, limit: LISTING_PAGE_SIZE, subCategoryExact: name } },
    ];
  }

  if (path === '/house-nameplates') {
    return [
      { key: 'category', url: '/categories/house-nameplates', required: true },
      { key: 'listing', url: '/products', params: { categorySlug: 'house-nameplates', limit: 1000 } },
    ];
  }
  return null;
};

// React 19 puts the hoisted <title>, <meta> and <link> elements a page renders
// (through <SEO>) at the start of renderToString's output
const HOISTED = /^(?:<title\b[^>]*>[\s\S]*?<\/title>|<(?:meta|link)\b[^>]*>)/;

// path may carry a ?query (listing pages read ?page). data: what
// catalogueRequests() fetched, for catalogue pages.
export const render = (path, data) => {
  const html = renderToString(
    <HelmetProvider>
      <PrerenderDataContext.Provider value={data}>
        <StaticRouter location={path}>
          <AuthProvider>
            <UIProvider>
              <CurrencyProvider>
                <CartProvider>
                  <Routes>
                    {Object.entries(PAGES).map(([route, Page]) => (
                      <Route key={route} path={route} element={<Page />} />
                    ))}
                    <Route path="/location/:city" element={<LocationPage />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/product/:slug" element={<ProductPage />} />
                    <Route path="/:slug" element={<CategoryPage />} />
                    <Route path="/:slug/:subcategorySlug" element={<CategoryPage />} />
                  </Routes>
                </CartProvider>
              </CurrencyProvider>
            </UIProvider>
          </AuthProvider>
        </StaticRouter>
      </PrerenderDataContext.Provider>
    </HelmetProvider>,
  );
  let body = html;
  let head = '';
  for (let match = HOISTED.exec(body); match; match = HOISTED.exec(body)) {
    head += match[0];
    body = body.slice(match[0].length);
  }
  return { head, body };
};
