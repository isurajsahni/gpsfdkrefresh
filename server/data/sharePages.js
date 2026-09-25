// Link-preview metadata for the site's fixed pages, served to WhatsApp /
// Facebook / X scrapers by routes/share.js (they don't run JavaScript, so they
// never see the tags each page sets in the browser). Keep each entry in step
// with the <SEO> title and description on the page itself.
const SHARE_PAGES = {
  canvas: {
    title: 'Canvas Wall Art | Premium Canvas Prints Online | GPSFDK',
    description: 'Premium canvas wall art from GPSFDK. Browse curated collections or turn your photo into a custom canvas: framed, ready to hang, delivered across India.',
  },
  'customize-canvas': {
    title: 'Customize Your Canvas | Turn Photos Into Art',
    description: 'Upload your photo and customize your own museum-grade canvas portrait.',
  },
  about: {
    title: 'About GPSFDK | Premium Canvas Prints & House Nameplates India',
    description: 'GPSFDK crafts premium wall canvas prints and custom house nameplates in India. Discover our story, craftsmanship, and commitment to luxury home décor.',
  },
  contact: {
    title: 'Contact Us | GPSFDK',
    description: "Get in touch with GPSFDK — email, phone, WhatsApp or Instagram. Questions about an order, a product, bulk enquiries or careers, we'll get back to you.",
  },
  consultancy: {
    title: 'Consultancy & Personalized Guidance | GPSFDK',
    description: "Bring us an idea, a requirement or a problem you're trying to solve. GPSFDK helps you find a clearer direction and shape a solution around what matters to you.",
  },
  faq: {
    title: 'Frequently Asked Questions | GPSFDK Support',
    description: 'Find answers to common questions about our premium canvases, custom nameplates, shipping, and returns.',
  },
  blog: {
    title: 'Canvas & Home Decor Blog | GPSFDK India',
    description: 'Expert guides, trends, and inspiration for canvas prints, custom nameplates, and home decor in India. Learn about gallery-wrapped canvas, split prints, and more.',
  },
  'shipping-policy': {
    title: 'Shipping Policy | GPSFDK Canvas & Nameplate Delivery India',
    description: 'GPSFDK shipping policy — delivery timelines, charges and order tracking for premium canvas prints and custom nameplates across India and worldwide.',
  },
  'returns-refunds': {
    title: 'Returns & Refunds Policy | GPSFDK India',
    description: 'How returns, replacements and refunds work for canvas prints and custom house nameplates at GPSFDK. Read our hassle-free policy.',
  },
  'privacy-policy': {
    title: 'Privacy Policy | GPSFDK',
    description: 'How GPSFDK collects, uses and protects your personal data when you shop for canvas prints and custom nameplates online.',
  },
  'terms-conditions': {
    title: 'Terms & Conditions | GPSFDK',
    description: 'Terms and conditions for shopping premium canvas prints and custom house nameplates at GPSFDK India.',
  },
  'track-order': {
    title: 'Track Order | GPSFDK',
    description: 'Track your GPSFDK order status easily using your Order ID and Email/Phone Number.',
  },
  ceo: {
    title: 'Meet the Founder | GPSFDK Premium Home Décor India',
    description: "Meet the founder of GPSFDK and read the story behind India's premium custom canvas prints and house nameplate brand.",
  },
  vision: {
    title: 'Our Vision & Core Values | GPSFDK',
    description: 'The vision and core values behind GPS — innovation, sustainability, community, and open knowledge. Bridging luxury and affordability, tradition and innovation.',
  },
  support: {
    title: 'Support & Order Tracking | GPSFDK',
    description: 'Track your GPSFDK order with the AWB number sent to your email, browse shipping and returns policies, or reach our support team.',
  },
  'premium-wall-canvas-india': {
    title: 'Premium Wall Canvas India | Luxury Wall Art & Decor',
    description: 'Discover premium wall canvas india! Transform your home with luxury wall canvas for living room, custom wall canvas india, and large wall art for bedroom india.',
  },
};

module.exports = { SHARE_PAGES };
