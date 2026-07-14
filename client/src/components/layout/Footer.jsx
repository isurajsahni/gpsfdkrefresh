import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { HiChevronRight } from 'react-icons/hi';
import logo from '../../assets/vite.webp';

// Helper: fire Meta Pixel Contact event (once per click)
const fireContactPixel = (method) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Contact', {
      content_name: method,
    });
    console.log(`[Meta Pixel] Contact event fired (${method})`);
  }
};

// Figma footer link columns. Consultancy/Getaway/Events/Careers have no
// dedicated pages yet, so they route to the contact form like the store page.
const LINK_COLUMNS = [
  {
    title: 'Shop and Learn',
    links: [
      { name: 'Store', path: '/' },
      { name: 'School of Learning', path: '/school-of-learning' },
      { name: 'Love', path: '/love' },
      { name: 'Partner', path: '/partner' },
      { name: 'Vision', path: '/vision' },
      { name: 'Contact', path: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { name: 'Canvases', path: '/wall-canvas' },
      { name: 'Nameplates', path: '/house-nameplates' },
      { name: 'Consultancy', path: '/contact' },
      { name: 'Getaway', path: '/contact' },
      { name: 'Events', path: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About GPS', path: '/about' },
      { name: 'CEO', path: '/ceo' },
      { name: 'Blog', path: '/blog' },
      { name: 'Careers', path: '/contact' },
      { name: 'Contact us', path: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { name: 'Support', path: '/support' },
      { name: 'Shipping & Delivery', path: '/shipping-policy' },
      { name: 'Return & Refunds', path: '/returns-refunds' },
      { name: 'FAQs', path: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', path: '/privacy-policy' },
      { name: 'Terms & Conditions', path: '/terms-conditions' },
      { name: 'Refund Policy', path: '/returns-refunds' },
      { name: 'Shipping Policy', path: '/shipping-policy' },
    ],
  },
];

const SOCIALS = [
  { icon: FaInstagram, href: 'https://www.instagram.com/canvas.gps/', label: 'Instagram' },
  { icon: FaWhatsapp, href: 'https://wa.me/916280310103', label: 'WhatsApp' },
];

// Thin vertical separator between bottom-bar items (Figma), desktop only.
const BarDivider = () => <span className="hidden sm:block w-px h-4 bg-secondary/15" />;

const Footer = () => (
  <footer className="bg-primary border-t border-secondary/10">
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-14 pb-10">
      {/* Breadcrumb: logo › GPS Store Online (current page) */}
      <nav aria-label="Breadcrumb">
        {/* items-end: crumb text sits at the bottom of the logo, level with the
            "GPS" wordmark, per Figma. */}
        <ol className="flex items-end gap-3">
          <li className="flex items-center">
            <Link to="/home" className="flex items-center">
              {/* Same rendered size as the navbar logo (50×50). */}
              <img src={logo} alt="GPSFDK Logo" className="w-[50px] h-auto object-contain" loading="lazy" decoding="async" />
            </Link>
          </li>
          <li className="flex items-center gap-3 pb-0.5" aria-current="page">
            <HiChevronRight className="w-3.5 h-3.5 text-[#424245]" aria-hidden="true" />
            <Link to="/" className="text-xs font-normal text-[#424245] hover:text-accent transition-colors">
              GPS Store Online
            </Link>
          </li>
        </ol>
      </nav>

      {/* Link columns */}
      <div className="mt-9 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10">
        {LINK_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-black font-medium text-xs">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs font-normal text-[#424245] hover:text-accent transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Socials (left) + phone (right) */}
      <div className="mt-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="text-[#424245] hover:text-accent transition-colors duration-200"
              onClick={() => social.label === 'WhatsApp' && fireContactPixel('WhatsApp')}
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
        <a
          href="tel:+916280310103"
          className="flex items-center gap-2 text-xs font-normal text-[#424245] hover:text-accent transition-colors"
          onClick={() => fireContactPixel('Phone')}
        >
          <FaPhoneAlt className="w-4 h-4" />
          +91 62803-10103
        </a>
      </div>
    </div>

    {/* Divider */}
    <div className="max-w-[900px] mx-auto px-4 sm:px-6">
      <div className="border-t border-secondary/10" />
    </div>

    {/* Bottom bar — email | copyright | policy links */}
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-x-6 gap-y-3 text-xs font-normal text-[#424245]">
        <a
          href="mailto:support@gpsfdk.com"
          className="flex items-center gap-2 hover:text-accent transition-colors"
          onClick={() => fireContactPixel('Email')}
        >
          <FaEnvelope className="w-4 h-4" />
          support@gpsfdk.com
        </a>
        <BarDivider />
        <p className="text-center">
          © {new Date().getFullYear()} Business Group & School of Learning. All rights reserved
        </p>
        <BarDivider />
        <Link to="/privacy-policy" className="hover:text-accent transition-colors">
          Privacy Policy
        </Link>
        <BarDivider />
        <Link to="/terms-conditions" className="hover:text-accent transition-colors">
          Terms & Conditions
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
