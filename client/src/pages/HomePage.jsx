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
        title="Premium Wall Canvas Prints & Custom House Nameplates India | GPSFDK"
        description="Shop premium wall canvas prints and custom house nameplates online in India. Museum-grade quality, custom sizes, fast delivery across India & worldwide."
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
