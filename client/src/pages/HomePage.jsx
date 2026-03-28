import SEO from '../components/seo/SEO';
import HeroVideo from '../components/home/HeroVideo';
import ProductSlider from '../components/home/ProductSlider';
import MasonryGrid from '../components/home/MasonryGrid';
import CategoryHighlights from '../components/home/CategoryHighlights';
import WatchBuySection from '../components/home/WatchBuySection';
import FeaturesSection from '../components/home/FeaturesSection';
import LeadForm from '../components/home/LeadForm';
import FAQAccordion from '../components/home/FAQAccordion';

const HomePage = () => {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GPSFDK",
    "url": "https://www.gpsfdk.com",
    "logo": "https://www.gpsfdk.com/logo.webp",
    "description": "Premium wall canvases and custom house nameplates provider in India.",
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

  return (
    <>
      <SEO 
        title="Premium Wall Canvas & Name Plates in India | Custom Designs"
        description="Buy custom wall canvas prints & stylish house name plates online in India. Modern designs, fast delivery & affordable pricing. Transform your home today!"
        schema={orgSchema}
      />
      <HeroVideo />
      <ProductSlider title="Wall Canvas" categorySlug="wall-canvas" />
      <MasonryGrid />
      <ProductSlider title="House Nameplates" categorySlug="house-nameplates" />
      <CategoryHighlights />
      <WatchBuySection />
      <FeaturesSection />
      <LeadForm />
      <FAQAccordion />
    </>
  );
};

export default HomePage;
