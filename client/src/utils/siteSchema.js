import { CONTACT } from './contactChannels';

// Site-level structured data, rendered on the homepage (/). Google reads the
// WebSite entity (for the site name in results) only from the homepage, and the
// Organization entity ties the brand's name, logo, contact details, address and
// profiles together for search and answer engines. Keep it to facts the site
// itself publishes: contact details come from contactChannels, the address and
// founder from the CEO page.

const SITE_URL = 'https://www.gpsfdk.com';

export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'GPSFDK',
  alternateName: 'GPS',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo-fav.webp`,
  description: 'Premium canvas wall art and custom house nameplates from India.',
  email: CONTACT.email,
  telephone: CONTACT.phoneDial,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Circular Road, Near More Store',
    addressLocality: 'Faridkot',
    addressRegion: 'Punjab',
    postalCode: '151203',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: CONTACT.phoneDial,
    email: CONTACT.email,
    contactType: 'customer service',
    availableLanguage: 'English',
  },
  // Brand profiles only; the founder's personal profiles belong on the founder.
  sameAs: [CONTACT.instagram],
  founder: {
    '@type': 'Person',
    name: 'Fimpy Garg',
    url: `${SITE_URL}/ceo`,
    sameAs: ['https://www.instagram.com/fimpygarg'],
  },
};

export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'GPSFDK',
  alternateName: 'GPS',
  url: `${SITE_URL}/`,
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};
