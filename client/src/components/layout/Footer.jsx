import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaInstagram, FaFacebookF, FaYoutube, FaWhatsapp, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import API from '../../utils/api';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const footerLinks = {
    'Shop': [
      { name: 'Wall Canvas', path: '/category/wall-canvas' },
      { name: 'House Nameplates', path: '/category/house-nameplates' },
    ],
    'Company': [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
      { name: 'FAQ', path: '/faq' },
    ],
    'Support': [
      { name: 'Shipping Policy', path: '/shipping-policy' },
      { name: 'Returns & Refunds', path: '/returns-refunds' },
      { name: 'Privacy Policy', path: '/privacy-policy' },
      { name: 'Terms & Conditions', path: '/terms-conditions' },
    ],
  };

  const socials = [
    { icon: FaInstagram, href: '#', label: 'Instagram', color: 'hover:text-pink-400' },
    { icon: FaFacebookF, href: '#', label: 'Facebook', color: 'hover:text-blue-400' },
    { icon: FaYoutube, href: '#', label: 'YouTube', color: 'hover:text-red-400' },
    { icon: FaWhatsapp, href: '#', label: 'WhatsApp', color: 'hover:text-green-400' },
  ];

  return (
    <footer className="bg-secondary text-white">
      {/* Newsletter Bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-heading font-semibold">Stay in the loop</h3>
              <p className="text-white/60 mt-1">Get exclusive offers & new arrivals straight to your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-5 py-3 bg-white/10 border border-white/20 rounded-l-full text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-colors"
                required
              />
              <button type="submit" className="bg-accent hover:bg-accent-dark px-6 py-3 rounded-r-full font-semibold transition-colors duration-300 whitespace-nowrap">
                {subscribed ? '✓ Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="text-3xl font-heading font-bold tracking-wider hover:text-accent transition-colors">
              GPSFDK
            </Link>
            <p className="mt-4 text-white/60 leading-relaxed max-w-sm">
              Premium wall canvases & custom house nameplates. Luxury made accessible — crafted with passion, delivered with care.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 ${social.color} transition-all duration-300 hover:scale-110`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading text-lg font-semibold mb-4 text-accent">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Bar */}
        <div className="mt-14 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-sm">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-accent" /> India</span>
              <span className="flex items-center gap-2"><FaPhoneAlt className="text-accent" /> +91 98765 43210</span>
              <span className="flex items-center gap-2"><FaEnvelope className="text-accent" /> contact@gpsfdk.com</span>
            </div>
            <p>© {new Date().getFullYear()} GPSFDK. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
