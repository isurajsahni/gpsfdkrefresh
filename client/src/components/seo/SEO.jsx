import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.gpsfdk.com';
// Default social-share image — must be a file that exists in client/public
const DEFAULT_IMAGE = '/graph.webp';

const SEO = ({
  title = "Premium Canvas & Name Plates in India | GPSFDK",
  description = "Buy custom canvas prints & stylish house name plates online in India. Modern designs, fast delivery & affordable pricing.",
  name = "GPSFDK",
  type = "website",
  image = DEFAULT_IMAGE,
  schema = null,
  noindex = false
}) => {
  const { pathname } = useLocation();
  // Normalize the pathname: strip trailing slash(es) except for the root path,
  // so /about/ and /about canonicalize to the same URL.
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const url = `${SITE_URL}${normalizedPath}`;

  // Social crawlers require absolute image URLs: prefix site-relative paths with
  // SITE_URL; full http(s) URLs pass through as-is.
  const resolvedImage = image || DEFAULT_IMAGE;
  const imageUrl = resolvedImage.startsWith('/') ? `${SITE_URL}${resolvedImage}` : resolvedImage;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Tell crawlers not to index this page (soft-404 / private pages) */}
      {noindex && <meta name="robots" content="noindex, follow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={name} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
