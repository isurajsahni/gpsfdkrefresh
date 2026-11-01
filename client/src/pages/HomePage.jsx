import SEO from '../components/seo/SEO';
import HeroVideo from '../components/home/HeroVideo';
import BeforeAfterSection from '../components/home/BeforeAfterSection';
import ProductSlider from '../components/home/ProductSlider';
import MasonryGrid from '../components/home/MasonryGrid';
import VideoShowcase from '../components/home/VideoShowcase';
import CategoryHighlights from '../components/home/CategoryHighlights';

import FeaturesSection from '../components/home/FeaturesSection';
import LeadForm from '../components/home/LeadForm';
import Testimonials from '../components/home/Testimonials';
import FAQAccordion from '../components/home/FAQAccordion';

const HomePage = () => {
  // Organization/WebSite schema lives on the real homepage (/, StorePage) —
  // see utils/siteSchema.js.
  return (
    <>
      <SEO
        title="Wall Canvas Art & Custom House Nameplates in India | GPSFDK"
        description="Canvas wall art in abstract, floral and modern styles, custom photo canvas prints and house nameplates. Ready to hang, delivered across India and worldwide."
      />
      <HeroVideo />
      <VideoShowcase />
      <ProductSlider title="Hot Selling" categorySlug="wall-canvas" hotSelling={true} />
      <MasonryGrid />
      <BeforeAfterSection />
      {/* Temporarily hidden until the House Nameplates catalog is restocked.
          To re-enable, uncomment the line below. */}
      {/* <ProductSlider title="House Nameplates" categorySlug="house-nameplates" showBadges={false} /> */}
      <CategoryHighlights />

      <FeaturesSection />
      <LeadForm />
      <Testimonials />
      <FAQAccordion />
    </>
  );
};

export default HomePage;
