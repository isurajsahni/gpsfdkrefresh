import { createContext, useContext } from 'react';

// Data the server already fetched for the page being rendered: set only when
// a page is rendered outside the browser (the build's prerender, or the SEO
// page renderer in api/render.js), so the page renders with it instead of its
// loading state. In the browser there is no provider, this is undefined, and
// pages load their data as usual.
export const PrerenderDataContext = createContext(undefined);

export const usePrerenderData = () => useContext(PrerenderDataContext);
