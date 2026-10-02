import { createElement as h } from 'react';
import { blogImage, blogSrcSet, TABLE_WRAP_CLASSES } from './blogShared.js';

// react-markdown component overrides for a blog post, shared by BlogPost and
// the build-time prerender. Written with createElement (no JSX) because Node
// loads it at build time without a JSX transform.
//
// headingIds: Map of source line → id, from extractHeadings().
// renderLink(to, children): how to render a link to a page on this site
// (react-router's <Link> in the app, a plain <a> in the static HTML).

const SITE_ORIGIN = /^https?:\/\/(www\.)?gpsfdk\.com/;

// react-markdown hands every component its syntax-tree node as a `node` prop;
// keep it off the DOM element
const domProps = (props) => {
  const rest = { ...props };
  delete rest.node;
  return rest;
};

export const markdownComponents = ({ headingIds, renderLink }) => {
  const heading = (Tag) =>
    function Heading(props) {
      return h(Tag, { ...domProps(props), id: headingIds.get(props.node?.position?.start?.line) });
    };

  return {
    h2: heading('h2'),
    h3: heading('h3'),
    a(props) {
      const { href = '', children } = props;
      if (href.startsWith('/') || SITE_ORIGIN.test(href)) {
        return renderLink(href.replace(SITE_ORIGIN, '') || '/', children);
      }
      return h('a', { ...domProps(props), target: '_blank', rel: 'noopener noreferrer' });
    },
    img(props) {
      const { src, alt } = props;
      return h('img', {
        ...domProps(props),
        src: blogImage(src, 1200),
        srcSet: blogSrcSet(src, [640, 960, 1440]),
        sizes: '(min-width: 1024px) 720px, 100vw',
        alt: alt || '',
        loading: 'lazy',
        decoding: 'async',
      });
    },
    // Wide comparison tables scroll sideways instead of stretching the page
    table(props) {
      return h('div', { className: TABLE_WRAP_CLASSES }, h('table', domProps(props)));
    },
  };
};
