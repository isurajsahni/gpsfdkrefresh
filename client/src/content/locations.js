// The city landing pages at /location/<city>, keyed by URL slug. Read by
// LocationPage and by the build's prerender (src/prerender/render.jsx), which
// writes one page per city; any other /location/<x> is a 404.
export const LOCATION_DATA = {
  'delhi': {
    popularStyles: 'Modern Golden Acrylic Name Plates & Contemporary Canvas Art',
    curatedHeadline: 'Delivering Premium Museum-Grade Canvases & Entrance Statement Pieces to the Nation\'s Capital.',
    popularProductsTitle: 'Curated Delhi Favorites',
  },
  'mumbai': {
    popularStyles: 'Minimalist Japandi Canvas Art & Premium Waterproof House Name Plates',
    curatedHeadline: 'Bringing Sophisticated, Ready-to-Hang Modern Art to the City of Dreams.',
    popularProductsTitle: 'Curated Mumbai Favorites',
  },
  'punjab': {
    popularStyles: 'Traditional Lord Ganesha & Trishula Acrylic Name Plates, Bold Motivational Work Canvases',
    curatedHeadline: 'Handcrafted Local Excellence, Delivered Straight from Our Faridkot Workshops.',
    popularProductsTitle: 'Curated Punjab Favorites',
  },
  'himachal-pradesh': {
    popularStyles: 'Breathtaking Nature Landscapes, Celestial Galaxy Split Canvases, Classic Stretched Wood Designs',
    curatedHeadline: 'Bringing Archival Quality, Weather-Protected Forest & Mountain Landscapes to the Hills.',
    popularProductsTitle: 'Curated Himachal Favorites',
  },
  'bangalore': {
    popularStyles: 'Abstract Minimalist Canvas Art for Apartments & Brushed Gold Acrylic Name Plates',
    curatedHeadline: 'Statement Wall Art & Modern Name Plates for the Garden City\'s Apartments, Villas & Studios.',
    popularProductsTitle: 'Curated Bangalore Favorites',
  },
  'hyderabad': {
    popularStyles: 'Royal Heritage-Motif Canvases & Elegant Golden Acrylic House Name Plates',
    curatedHeadline: 'Regal Canvas Art & Entrance Name Plates Worthy of the City of Pearls.',
    popularProductsTitle: 'Curated Hyderabad Favorites',
  },
  'chennai': {
    popularStyles: 'Tanjore-Inspired Canvas Art & Humidity-Resistant Weatherproof Name Plates',
    curatedHeadline: 'Coastal-Proof Premium Canvases & Name Plates Built for Chennai Homes.',
    popularProductsTitle: 'Curated Chennai Favorites',
  },
  'pune': {
    popularStyles: 'Serene Sahyadri Landscape Canvases & Contemporary Marathi Calligraphy Name Plates',
    curatedHeadline: 'Modern Wall Canvases & Designer Name Plates for Pune\'s Heritage & New-Age Homes.',
    popularProductsTitle: 'Curated Pune Favorites',
  }
};
