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
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GPSFDK",
    "url": "https://www.gpsfdk.com",
    "logo": "https://www.gpsfdk.com/logo-fav.webp",
    "description": "Premium canvases and custom house nameplates provider in India.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9646646063",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://www.facebook.com/darsh.garg.39",
      "https://www.instagram.com/fimpygarg"
    ]
  };

  // WebSite schema with SearchAction — enables the Google sitelinks search box
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GPSFDK",
    "url": "https://www.gpsfdk.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.gpsfdk.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <SEO
        title="Premium Wall Canvas Prints & Custom House Nameplates India | GPSFDK"
        description="Shop premium wall canvas prints and custom house nameplates online in India. Museum-grade quality, custom sizes, fast delivery across India & worldwide."
        schema={[orgSchema, websiteSchema]}
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
