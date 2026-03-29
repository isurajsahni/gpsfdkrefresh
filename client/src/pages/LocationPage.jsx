import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/seo/SEO';
import ProductSlider from '../components/home/ProductSlider';
import FeaturesSection from '../components/home/FeaturesSection';
import React from 'react';

const LocationPage = () => {
  const { city } = useParams();
  
  // Format city name for display (e.g. new-delhi -> New Delhi)
  const formatCity = (str) => {
    if (!str) return 'India';
    return str.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", 
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Delhi" // Adding Delhi as it is a major union territory/state equivalent
  ];
  
  const cityName = formatCity(city);
  
  // Default values based on the generated SEO strategy
  const title = `Premium Wall Canvas & Name Plates in ${cityName} | Custom Canvas Prints India`;
  const description = `Looking for Custom Canvas Prints in ${cityName}? GPSFDK offers Gallery Wrapped Canvas, Aesthetic Wall Decor, and premium Photo to Canvas services across ${cityName}.`;
  
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `GPSFDK Decor ${cityName}`,
    "image": "https://www.gpsfdk.com/logo.webp",
    "url": `https://www.gpsfdk.com/location/${city}`,
    "telephone": "+91-9646646063",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressCountry": "IN"
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <SEO 
        title={title} 
        description={description} 
        schema={localBusinessSchema}
      />
      
      {/* Hero Section tailored to the location */}
      <section className="relative min-h-[100dvh] pt-[140px] pb-20 overflow-hidden bg-secondary flex flex-col justify-center items-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607688969-a5bfcd64bd15?q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/80 to-secondary z-10"></div>
        
        <div className="max-w-6xl w-full mx-auto px-6 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
              Premium House Name Plates & <br className="hidden md:block" />
              Wall Canvas in <span className="text-accent">{cityName}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-10 font-body">
              Transform your living space with our Top-Rated Gallery Wrapped Canvas and Custom Photo to Canvas Prints. Whether you need Aesthetic Wall Art or durable LED nameplates, we deliver museum-quality decor straight to {cityName}.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/house-nameplates" className="btn-primary w-full sm:w-auto text-lg px-8 py-3.5">
                Shop Name Plates
              </Link>
              <Link to="/wall-canvas" className="px-8 py-3.5 rounded-full font-heading font-bold uppercase tracking-wider text-sm bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 w-full sm:w-auto">
                Explore Wall Art
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <div className="py-12 bg-primary">
        <ProductSlider title={`Trending Name Plates in ${cityName}`} categorySlug="house-nameplates" featured={true} />
      </div>
      
      <div className="py-12 bg-secondary/5">
        <ProductSlider title={`Popular Canvas Art in ${cityName}`} categorySlug="wall-canvas" featured={true} />
      </div>

      {/* Value props customized for location */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="bg-secondary text-white rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
           
           <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 relative z-10">Why {cityName} Chooses GPSFDK</h2>
           <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 relative z-10">
             We understand the unique architectural styles and modern decor preferences of homeowners in {cityName}. Our durable, weather-resistant materials ensure your custom decor lasts a lifetime.
           </p>
           
           <Link to="/contact" className="inline-block btn-primary relative z-10 px-8 py-4 text-lg">
             Contact Our Local Team
           </Link>
        </div>
      </section>

      {/* Internal SEO Links for 29 States */}
      <section className="py-20 max-w-7xl mx-auto px-6 border-t border-gray-200">
        <h3 className="text-2xl font-heading font-bold text-secondary text-center mb-10">
          Wall Canvas & Name Plates Delivered Across India
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
          {indianStates.map((state) => {
            const stateSlug = state.toLowerCase().replace(/\s+/g, '-');
            return (
              <Link 
                key={state} 
                to={`/location/${stateSlug}`}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  cityName.toLowerCase() === state.toLowerCase() 
                    ? 'bg-accent text-white shadow-lg' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-accent hover:text-accent shadow-sm'
                }`}
              >
                {state}
              </Link>
            )
          })}
        </div>
      </section>

      <FeaturesSection />
    </div>
  );
};

export default LocationPage;
