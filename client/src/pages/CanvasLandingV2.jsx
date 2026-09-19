import SEO from '../components/seo/SEO';
import CanvasHero from '../components/canvas-v2/CanvasHero';
import ArtStyleGrid from '../components/canvas-v2/ArtStyleGrid';
import ArtInRealLife from '../components/canvas-v2/ArtInRealLife';
import ProductGrid from '../components/canvas-v2/ProductGrid';
import CtaBanner from '../components/canvas-v2/CtaBanner';
import FaqSection from '../components/landing/FaqSection';

/* ───────────────────────────────────────────────────────────────────────────
   Canvas Page v2 — DEMO ONLY

   Rebuild of the "Canvas Page" frame in the Canvas Page Figma file
   (figma.com/design/7gCw9F9RUAYrudmzJtsHWM, node 22:7).

   Not linked from anywhere in the site and marked noindex. The production page
   at /customize-canvas is untouched.

   Sizes, colours, radii and gaps are read from the Figma layers via the Figma
   MCP. Each section lives in components/canvas-v2 and starts at its heading's
   line box; the gaps below are the frame's own spacing between sections
   (measured from where the site's 60px navbar ends, where Figma's is 50px),
   except around "Art in real life", which is deliberately roomier than the
   frame's 88 / 91px. The FAQ is the same component the Consultancy page
   uses — Figma lays both out identically.
   ─────────────────────────────────────────────────────────────────────────── */

/* The design writes out only the first answer. Returns and framing follow the
   live FAQ page; payment methods and international shipping are PLACEHOLDER —
   confirm those two before this goes anywhere real. */
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
    a: 'Returns are accepted within 7 days of delivery. If your order arrives damaged, or we get a customisation wrong, we will replace it or refund you in full.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards, UPI, net banking and popular wallets are accepted at checkout.',
  },
  {
    q: 'Are the canvases framed?',
    a: 'Every canvas is stretched by hand over a durable wooden frame and arrives ready to hang — no separate framing needed.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We currently ship across India. For international orders, write to us and we will arrange a quote for your location.',
  },
];

export default function CanvasLandingV2() {
  return (
    // Bottom padding, not margin: a margin would collapse out of <main> and
    // show the body's cream behind the gap above the footer.
    <main className="overflow-x-clip bg-white pb-20 pt-[60px] lg:pb-[100px]">
      <SEO
        title="Canvas Page v2 — internal demo"
        description="Internal demo rebuild of the Canvas Page design. Not a live page."
        noindex
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
        className="mt-16 lg:mt-[87px]"
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
