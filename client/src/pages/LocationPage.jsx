import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/seo/SEO';
import ProductSlider from '../components/home/ProductSlider';
import FeaturesSection from '../components/home/FeaturesSection';
import API from '../utils/api';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage } from '../utils/imageOptimizer';

const BESTSELLER_LABELS = [
  'Best Seller',
  'Most Sold',
  'Top Choice',
  'Hot Seller',
  'Most Loved',
  'Top Seller',
  'Best Selling',
  'Customer Favorite'
];

const getBestsellerLabel = (id) => {
  if (!id) return 'Best Seller';
  let hash = 0;
  const str = String(id);
  for (let idx = 0; idx < str.length; idx++) {
    hash = str.charCodeAt(idx) + ((hash << 5) - hash);
  }
  return BESTSELLER_LABELS[Math.abs(hash) % BESTSELLER_LABELS.length];
};

const LOCATION_DATA = {
  'delhi': {
    delivery: 'Delivered to Delhi in 3-4 days',
    shippingSpeed: 'Express Metro Air Delivery',
    popularStyles: 'Modern Golden Acrylic Name Plates & Contemporary Wall Canvas Art',
    phone: '+91 96466-46063',
    whatsapp: 'https://wa.me/919646646063?text=Hi%20GPSFDK,%20I%20am%20from%20Delhi%20and%20looking%20for%20custom%20decor.',
    curatedHeadline: 'Delivering Premium Museum-Grade Canvases & Entrance Statement Pieces to the Nation\'s Capital.',
    popularProductsTitle: 'Curated Delhi Favorites',
  },
  'mumbai': {
    delivery: 'Delivered to Mumbai in 4-5 days',
    shippingSpeed: 'Express Coastal Air Delivery',
    popularStyles: 'Minimalist Japandi Canvas Art & Premium Waterproof House Name Plates',
    phone: '+91 96466-46063',
    whatsapp: 'https://wa.me/919646646063?text=Hi%20GPSFDK,%20I%20am%20from%20Mumbai%20and%20looking%20for%20custom%20decor.',
    curatedHeadline: 'Bringing Sophisticated, Ready-to-Hang Modern Art to the City of Dreams.',
    popularProductsTitle: 'Curated Mumbai Favorites',
  },
  'punjab': {
    delivery: 'Delivered to Punjab in 1-2 days',
    shippingSpeed: 'Next-Day Punjab Local Delivery',
    popularStyles: 'Traditional Lord Ganesha & Trishula Acrylic Name Plates, Bold Motivational Work Canvases',
    phone: '+91 96466-46063',
    whatsapp: 'https://wa.me/919646646063?text=Hi%20GPSFDK,%20I%20am%20from%20Punjab%20and%20looking%20for%20custom%20decor.',
    curatedHeadline: 'Handcrafted Local Excellence, Delivered Straight from Our Faridkot Workshops.',
    popularProductsTitle: 'Curated Punjab Favorites',
  },
  'himachal-pradesh': {
    delivery: 'Delivered to Himachal Pradesh in 3-5 days',
    shippingSpeed: 'Express Hill Area Shipping',
    popularStyles: 'Breathtaking Nature Landscapes, Celestial Galaxy Split Canvases, Classic Stretched Wood Designs',
    phone: '+91 96466-46063',
    whatsapp: 'https://wa.me/919646646063?text=Hi%20GPSFDK,%20I%20am%20from%20Himachal%20and%20looking%20for%20custom%20decor.',
    curatedHeadline: 'Bringing Archival Quality, Weather-Protected Forest & Mountain Landscapes to the Hills.',
    popularProductsTitle: 'Curated Himachal Favorites',
  }
};

const LocationPage = () => {
  const { city } = useParams();
  const { formatPrice } = useCurrency();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
    "Uttarakhand", "West Bengal", "Delhi"
  ];
  
  const cityName = formatCity(city);
  const normalized = city?.toLowerCase();

  // Get tailored local data or robust national default
  const localData = LOCATION_DATA[normalized] || {
    delivery: `Delivered to ${cityName} in 4-6 days`,
    shippingSpeed: 'Free Insured Courier Shipping across India',
    popularStyles: 'Museum-Grade Custom Photo Canvases & Handcrafted House Name Plates',
    phone: '+91 96466-46063',
    whatsapp: `https://wa.me/919646646063?text=Hi%20GPSFDK,%20I%20am%20from%20${encodeURIComponent(cityName)}%20and%20looking%20for%20custom%20decor.`,
    curatedHeadline: `Premium Handcrafted Decor, Safely Packaged and Shipped Directly to Your Home in ${cityName}.`,
    popularProductsTitle: `Curated ${cityName} Favorites`,
  };

  // Meta Pixel: ViewContent event for location landing pages
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'ViewContent', {
        content_name: `Location Page - ${cityName}`,
        content_category: 'Landing Page',
      });
      console.log(`[Meta Pixel] ViewContent event fired (Location: ${cityName})`);
    }
  }, [cityName]);

  // Load all products to select the best 6-8 designs dynamically
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/products', {
          params: { limit: 24 }
        });
        setProducts(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [city]);

  // City-specific catalog curation algorithm
  const getCuratedProducts = () => {
    if (products.length === 0) return [];
    
    if (normalized === 'punjab') {
      const ganesha = products.find(p => p.name?.toLowerCase().includes('ganesha'));
      const trishula = products.find(p => p.name?.toLowerCase().includes('trishula'));
      const wolf = products.find(p => p.name?.toLowerCase().includes('wolf'));
      const colors = products.find(p => p.name?.toLowerCase().includes('colors'));
      const remaining = products.filter(p => p !== ganesha && p !== trishula && p !== wolf && p !== colors);
      return [ganesha, trishula, wolf, colors, ...remaining].filter(Boolean).slice(0, 8);
    }
    
    if (normalized === 'delhi' || normalized === 'mumbai') {
      const gold = products.find(p => p.name?.toLowerCase().includes('gold') || p.name?.toLowerCase().includes('sunehra'));
      const colors = products.find(p => p.name?.toLowerCase().includes('colors') || p.name?.toLowerCase().includes('dreaming'));
      const modern = products.find(p => p.name?.toLowerCase().includes('modern'));
      const obsidian = products.find(p => p.name?.toLowerCase().includes('obsidian'));
      const remaining = products.filter(p => p !== gold && p !== colors && p !== modern && p !== obsidian);
      return [gold, colors, modern, obsidian, ...remaining].filter(Boolean).slice(0, 8);
    }
    
    if (normalized === 'himachal-pradesh') {
      const azure = products.find(p => p.name?.toLowerCase().includes('azure'));
      const celestial = products.find(p => p.name?.toLowerCase().includes('celestial'));
      const outcast = products.find(p => p.name?.toLowerCase().includes('outcast'));
      const right = products.find(p => p.name?.toLowerCase().includes('right'));
      const remaining = products.filter(p => p !== azure && p !== celestial && p !== outcast && p !== right);
      return [azure, celestial, outcast, right, ...remaining].filter(Boolean).slice(0, 8);
    }
    
    // Fallback: show first 8 products
    return products.slice(0, 8);
  };

  const curatedProducts = getCuratedProducts();
  
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
            {/* Delivery Alert Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FFF7E7]/15 border border-[#FFF7E7]/30 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full mb-8 shadow-sm tracking-[0.05em]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-accent animate-bounce">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.02-1.661L3 12m18 3.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5a1.125 1.125 0 001.12-1.012L22.5 12m-2.25 3.75h-2.25M3 12l1.03-3.21a1.5 1.5 0 011.405-1.04h11.599a1.5 1.5 0 011.405 1.04L21 12M3 12h18" />
              </svg>
              {localData.delivery} · {localData.shippingSpeed}
            </div>

            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
              Premium House Name Plates & <br className="hidden md:block" />
              Wall Canvas in <span className="text-accent">{cityName}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-10 font-body leading-relaxed">
              Transform your living space with our Top-Rated Gallery Wrapped Canvas and Custom Photo to Canvas Prints. Whether you need Aesthetic Wall Art or durable custom nameplates, we deliver museum-quality decor straight to {cityName}.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/house-nameplates" className="btn-primary w-full sm:w-auto text-lg px-8 py-3.5">
                Shop Name Plates
              </Link>
              <a 
                href={localData.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-full font-heading font-bold uppercase tracking-wider text-sm bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-accent">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.963L2 22l5.233-1.372a9.912 9.912 0 0 0 4.773 1.218h.004c5.505 0 9.989-4.478 9.99-9.984a9.965 9.965 0 0 0-2.927-7.065A9.917 9.917 0 0 0 12.012 2zm5.772 14.195c-.32.9-.84 1.636-1.557 2.193-.68.53-1.464.793-2.316.78-1.537-.023-3.03-.548-4.398-1.542a12.35 12.35 0 0 1-3.693-3.692c-.993-1.368-1.518-2.861-1.541-4.398-.013-.852.25-1.636.78-2.316a4.01 4.01 0 0 1 2.193-1.557c.224-.08.435-.04.597.12l1.62 1.62a.482.482 0 0 1 .08.597l-.61 1.22c-.11.22-.05.485.138.673l1.838 1.838c.188.188.453.248.673.138l1.22-.61a.482.482 0 0 1 .597.08l1.62 1.62c.16.162.2.373.12.597z"/>
                </svg>
                Consult Design Team
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Curated Regional Collection Grid */}
      <section className="py-24 bg-primary max-w-7xl mx-auto px-6 text-center">
        <div className="mb-14">
          <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">
            Handpicked for You
          </span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-secondary">
            {localData.popularProductsTitle}
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto font-body text-base">
            {localData.curatedHeadline}
          </p>
          <div className="w-20 h-[3px] bg-accent mt-[15px] mx-auto rounded-full" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : curatedProducts.length === 0 ? (
          <p className="text-gray-400">Loading your personalized catalog...</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {curatedProducts.map((product) => {
              const prices = [
                product.basePrice,
                ...(product.variations || []).map(v => v.price)
              ].filter(p => typeof p === 'number' && p > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : (product.basePrice || 0);

              // Badge check
              let badgeType = "";
              const variations = product.variations || [];
              const totalStock = variations.reduce((acc, v) => acc + (v.stock || 0), 0);
              if (variations.length > 0 && totalStock > 0 && totalStock <= 10) {
                badgeType = "lowstock";
              } else if (product.featured) {
                badgeType = "bestseller";
              }

              const badgeColors = {
                bestseller: 'bg-[#F5A623]',
                lowstock: 'bg-[#E74C3C]'
              };

              const badgeLabels = {
                bestseller: 'Bestseller',
                lowstock: 'Low Stock'
              };

              return (
                <div 
                  key={product._id} 
                  className="group bg-white rounded-2xl overflow-hidden border border-cream-dark shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-cream-dark">
                    {badgeType && (
                      badgeType === 'bestseller' ? (
                        <div className="absolute top-3 left-3 z-10 text-[9px] px-3 py-1.5 rounded-full font-bold text-white uppercase tracking-widest bg-gradient-to-r from-[#F15A29] to-[#F5A623] shadow-[0_0_12px_rgba(241,90,41,0.6)] border border-white/20 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white animate-pulse">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                          </svg>
                          <span>{getBestsellerLabel(product._id)}</span>
                        </div>
                      ) : (
                        <span className={`absolute top-3 left-3 z-10 text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider text-white shadow-sm ${badgeColors[badgeType]}`}>
                          {badgeLabels[badgeType]}
                        </span>
                      )
                    )}
                    <img
                      src={optimizeImage(product.images?.[0]?.url, 400) || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow justify-between text-left">
                    <div>
                      <h4 className="font-heading font-bold text-secondary text-sm group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-accent font-bold text-sm mt-2">
                        Starting from {formatPrice(minPrice)}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Link 
                        to={`/product/${product.slug}`}
                        className="flex-1 text-center py-2.5 rounded-lg bg-secondary text-white text-[10px] font-heading font-bold uppercase tracking-wider hover:bg-secondary-dark transition-all duration-200"
                      >
                        Details
                      </Link>
                      <a 
                        href={`https://wa.me/919646646063?text=Hi%20GPSFDK,%20I%20am%20from%20${encodeURIComponent(cityName)}%20and%20interested%20in%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2.5 rounded-lg bg-accent text-white text-[10px] font-heading font-bold uppercase tracking-wider hover:bg-accent-dark transition-all duration-200 flex items-center justify-center gap-1"
                      >
                        Order via WA
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured sliders as supplementary browse */}
      <div className="py-12 bg-primary/40 border-t border-[#0B5D3B]/5">
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
           <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 relative z-10 leading-relaxed font-body">
             We understand the unique architectural styles and modern decor preferences of homeowners in {cityName}. Our durable, weather-resistant materials ensure your custom nameplates and museum-grade canvases last a lifetime.
           </p>
           
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
             <a 
               href={localData.whatsapp}
               target="_blank"
               rel="noopener noreferrer"
               className="btn-primary px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-2"
               onClick={() => { if (typeof window.fbq === 'function') { window.fbq('track', 'Contact', { content_name: `Location WhatsApp - ${cityName}` }); } }}
             >
               Chat with {cityName} Specialist
             </a>
             <a 
               href={`tel:${localData.phone}`}
               className="px-8 py-4 rounded-full font-heading font-bold uppercase tracking-wider text-sm bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 w-full sm:w-auto flex items-center justify-center gap-2"
               onClick={() => { if (typeof window.fbq === 'function') { window.fbq('track', 'Contact', { content_name: `Location Phone - ${cityName}` }); } }}
             >
               Call support: {localData.phone}
             </a>
           </div>
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
