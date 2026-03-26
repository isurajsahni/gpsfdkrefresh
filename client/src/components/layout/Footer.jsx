import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import logo from '../../assets/vite.webp';

const Footer = () => {
  const navLinks = [
    { name: 'Contact us', path: '/contact' },
    { name: 'About us', path: '/about' },
    { name: 'Shipping & Delivery Policy', path: '/shipping-policy' },
    { name: 'CEO', path: '/ceo' },
    { name: 'FAQs', path: '/faq' },
    { name: 'Terms & Conditions', path: '/terms-conditions' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
  ];

  const socials = [
    { icon: FaInstagram, href: 'https://www.instagram.com/canvas.gps/', label: 'Instagram' },
    { icon: FaWhatsapp, href: 'https://wa.me/916280310103', label: 'WhatsApp' },
  ];

  return (
    <footer className="bg-primary border-t border-secondary/10">
      {/* Upper section — logo, tagline, nav, socials */}
      <div className="max-w-5xl mx-auto px-4 pt-14 pb-10 text-center">
        {/* Logo */}
        <Link to="/" className="inline-block">
          <img src={logo} alt="GPSFDK Logo" className="h-20 w-auto mx-auto" />
        </Link>

        {/* Tagline */}
        <p className="mt-4 text-secondary font-heading font-semibold text-base tracking-wide">
          Business Group & School Of Learning.
        </p>

        {/* Nav Links */}
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-secondary/80 text-sm hover:text-accent transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Social Icons */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="text-secondary/50 hover:text-accent transition-colors duration-200"
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-secondary/10" />

      {/* Bottom bar — email, copyright, phone */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Email */}
          <a
            href="mailto:customer@gpsfdk.com"
            className="flex items-center gap-2 text-secondary/70 hover:text-accent transition-colors"
          >
            <FaEnvelope className="w-4 h-4" />
            customer@gpsfdk.com
          </a>

          {/* Copyright */}
          <p className="text-secondary/50 text-center">
            © {new Date().getFullYear()} Business Group & School of Learning.<br className="sm:hidden" /> All rights reserved
          </p>

          {/* Phone */}
          <a
            href="tel:+916280310103"
            className="flex items-center gap-2 text-secondary/70 hover:text-accent transition-colors"
          >
            <FaPhoneAlt className="w-4 h-4" />
            +91 62803-10103
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
