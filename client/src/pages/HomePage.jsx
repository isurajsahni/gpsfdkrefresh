import HeroVideo from '../components/home/HeroVideo';
import ProductSlider from '../components/home/ProductSlider';
import MasonryGrid from '../components/home/MasonryGrid';
import WatchBuySection from '../components/home/WatchBuySection';
import FeaturesSection from '../components/home/FeaturesSection';
import LeadForm from '../components/home/LeadForm';
import FAQAccordion from '../components/home/FAQAccordion';

const HomePage = () => {
  return (
    <>
      <HeroVideo />
      <ProductSlider title="Wall Canvas" categorySlug="wall-canvas" />
      <MasonryGrid />
      <ProductSlider title="House Nameplates" categorySlug="house-nameplates" />
      <WatchBuySection />
      <FeaturesSection />
      <LeadForm />
      <FAQAccordion />
    </>
  );
};

export default HomePage;
