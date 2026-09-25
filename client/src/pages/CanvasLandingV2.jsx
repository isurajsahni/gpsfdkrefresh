import SEO from '../components/seo/SEO';
import CanvasHero from '../components/canvas-v2/CanvasHero';
import ArtStyleGrid from '../components/canvas-v2/ArtStyleGrid';
import ArtInRealLife from '../components/canvas-v2/ArtInRealLife';
import ProductGrid from '../components/canvas-v2/ProductGrid';
import CtaBanner from '../components/canvas-v2/CtaBanner';
import FaqSection from '../components/landing/FaqSection';

/* ───────────────────────────────────────────────────────────────────────────
   Canvas — the Wall Canvas landing page, served at /canvas.

   Rebuild of the "Canvas Page" frame in the Canvas Page Figma file
   (figma.com/design/7gCw9F9RUAYrudmzJtsHWM, node 22:7). It replaces the old
   all-canvas listing at /wall-canvas, which now redirects here; each art style
   still opens its collection at /wall-canvas/<collection>.

   Sizes, colours, radii and gaps are read from the Figma layers via the Figma
   MCP. Each section lives in components/canvas-v2 and starts at its heading's
   line box; the gaps below are the frame's own spacing between sections
   (measured from where the site's 60px navbar ends, where Figma's is 50px),
   except around "Art in real life" and above the FAQ, which are deliberately
   roomier than the frame's 88 / 91 / 87px. The FAQ is the same component the
   Consultancy page uses — Figma lays both out identically.
   ─────────────────────────────────────────────────────────────────────────── */

/* The design writes out only the first answer. The rest are taken from the
   site itself: returns from /returns-refunds, payment options from checkout
   (Razorpay for everyone, Cash on Delivery for Indian orders only — the order
   API enforces it), the hanging kit from the product page's "in the box", and
   worldwide delivery from checkout's country list and local-currency pricing. */
const FAQS = [
  {
    q: 'How long does shipping take?',
    a: [
      'We typically deliver within 5–7 business days across India.',
      'Express delivery is available for select PIN codes within 2–3 days.',
    ],
  },
  {
    q: 'What is your return policy?',
    a: 'Non-customised items can be returned within 7 days of delivery. If your order arrives damaged, or we get a customisation wrong, we’ll replace it or refund you in full.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'UPI, credit and debit cards and net banking, all through Razorpay’s secure checkout. Cash on Delivery is also available on orders within India.',
  },
  {
    q: 'Are the canvases framed?',
    a: 'Yes. Every canvas is stretched over a durable wooden frame and comes with a hanging kit, so it’s ready for your wall with no extra framing.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes, we deliver worldwide. Just enter your address at checkout: prices are shown in your local currency, and every order comes with a tracking link. Cash on Delivery is only available within India.',
  },
];

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.gpsfdk.com' },
    { '@type': 'ListItem', position: 2, name: 'Canvas Wall Art' },
  ],
};

export default function CanvasLandingV2() {
  return (
    // Bottom padding, not margin: a margin would collapse out of <main> and
    // show the body's cream behind the gap above the footer.
    <main className="overflow-x-clip bg-white pb-20 pt-[60px] lg:pb-[100px]">
      <SEO
        title="Canvas Wall Art | Premium Canvas Prints Online | GPSFDK"
        description="Premium canvas wall art from GPSFDK. Browse curated collections or turn your photo into a custom canvas: framed, ready to hang, delivered across India."
        schema={BREADCRUMB_SCHEMA}
      />
      <CanvasHero />
      <div className="mt-14 lg:mt-[90px]">
        <ArtStyleGrid />
      </div>
      <div className="mt-20 lg:mt-[120px]">
        <ArtInRealLife />
      </div>
      <div className="mt-20 lg:mt-[120px]">
        <ProductGrid />
      </div>
      <FaqSection
        className="mt-20 lg:mt-[120px]"
        headingClassName="text-black"
        heading={
          <>
            <span className="block">Frequently asked</span>
            <span className="block">questions</span>
          </>
        }
        items={FAQS}
      />
      <div className="mt-16 lg:mt-[100px]">
        <CtaBanner />
      </div>
    </main>
  );
}
