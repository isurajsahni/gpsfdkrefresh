// Blog metadata registry — each entry maps to a .md file in this directory
// Keywords extracted from top competitors: CanvasChamp, PrintPosters, DessineArt, OrchidDigitals, India Circus, Vistaprint

import blog1 from './ultimate-guide-wall-canvas-living-room.md?raw';
import blog2 from './photo-to-canvas-memories-gallery-art.md?raw';
import blog3 from './what-is-gallery-wrapped-canvas.md?raw';
import blog4 from './aesthetic-wall-art-trends-indian-homes.md?raw';
import blog5 from './canvas-vs-framed-prints-best-investment.md?raw';
import blog6 from './how-to-hang-large-canvas-prints.md?raw';
import blog7 from './cleaning-maintaining-canvas-wall-decor.md?raw';
import blog8 from './styling-bedroom-modern-canvas-art.md?raw';
import blog9 from './custom-canvas-prints-anniversary-gift.md?raw';
import blog10 from './split-canvas-prints-multi-panel-display.md?raw';
import blog11 from './eco-friendly-sustainable-canvas-prints-india.md?raw';
import blog12 from './transforming-home-offices-wall-canvas.md?raw';

const blogs = [
  {
    slug: 'ultimate-guide-wall-canvas-living-room',
    title: 'The Ultimate Guide to Choosing the Perfect Wall Canvas for Your Living Room',
    excerpt: 'From sizing and styles to materials and colour coordination — everything you need to pick the ideal canvas print for your living room decor.',
    category: 'Guide',
    readTime: '8 min read',
    date: '2024-12-15',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    keywords: ['wall canvas prints India', 'canvas for living room', 'custom canvas wall art', 'buy canvas painting online', 'modern wall decor'],
    content: blog1,
  },
  {
    slug: 'photo-to-canvas-memories-gallery-art',
    title: 'Photo to Canvas: How to Turn Your Memories into Gallery-Quality Art',
    excerpt: 'Learn how to convert your favourite photos into stunning museum-quality canvas prints. From choosing the right resolution to selecting the perfect finish.',
    category: 'How-To',
    readTime: '7 min read',
    date: '2024-12-10',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    keywords: ['photo to canvas printing', 'personalized canvas prints', 'custom photo canvas India', 'photo print on canvas online'],
    content: blog2,
  },
  {
    slug: 'what-is-gallery-wrapped-canvas',
    title: 'What is Gallery-Wrapped Canvas? Everything You Need to Know',
    excerpt: 'Understand the most popular canvas mounting technique used by galleries and museums — and why it matters for your home decor.',
    category: 'Education',
    readTime: '6 min read',
    date: '2024-12-05',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    keywords: ['gallery wrapped canvas', 'stretched canvas prints', 'museum quality canvas', 'canvas framing options'],
    content: blog3,
  },
  {
    slug: 'aesthetic-wall-art-trends-indian-homes',
    title: '5 Aesthetic Wall Art Trends Dominating Indian Homes in 2024',
    excerpt: 'From Japandi minimalism to Neo-Traditional Indian art — discover the five biggest wall art trends transforming homes across India.',
    category: 'Trends',
    readTime: '9 min read',
    date: '2024-11-28',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
    keywords: ['aesthetic wall art India', 'modern wall decor trends', 'canvas painting for bedroom', 'abstract canvas art online', 'contemporary wall art'],
    content: blog4,
  },
  {
    slug: 'canvas-vs-framed-prints-best-investment',
    title: 'Canvas vs. Framed Prints: Which is the Best Investment?',
    excerpt: 'A detailed comparison of canvas prints and framed prints — covering cost, durability, aesthetics, and which option delivers the best value.',
    category: 'Comparison',
    readTime: '7 min read',
    date: '2024-11-20',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80',
    keywords: ['canvas vs framed prints', 'best wall art for home', 'canvas print price India', 'HD canvas prints'],
    content: blog5,
  },
  {
    slug: 'how-to-hang-large-canvas-prints',
    title: 'How to Hang Large Canvas Prints Like a Professional',
    excerpt: 'Step-by-step instructions for perfectly hanging large canvas art on any wall type — including concrete, brick, and drywall.',
    category: 'How-To',
    readTime: '6 min read',
    date: '2024-11-15',
    image: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?w=800&q=80',
    keywords: ['how to hang canvas', 'large canvas prints', 'canvas wall art installation', 'ready to hang canvas'],
    content: blog6,
  },
  {
    slug: 'cleaning-maintaining-canvas-wall-decor',
    title: 'The Secret to Cleaning and Maintaining Your Canvas Wall Decor',
    excerpt: 'Protect your investment with this complete guide to cleaning, protecting, and maintaining canvas prints in India\'s climate.',
    category: 'Care',
    readTime: '7 min read',
    date: '2024-11-08',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    keywords: ['canvas maintenance', 'cleaning canvas prints', 'UV resistant canvas', 'archival inkjet printing', 'weather proof prints'],
    content: blog7,
  },
  {
    slug: 'styling-bedroom-modern-canvas-art',
    title: 'Minimalist to Maximalist: Styling Your Bedroom with Modern Canvas Art',
    excerpt: 'Whether you love serene minimalism or bold maximalism — discover how the right canvas art can completely transform your bedroom aesthetic.',
    category: 'Inspiration',
    readTime: '10 min read',
    date: '2024-10-30',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
    keywords: ['canvas painting for bedroom', 'modern bedroom wall decor', 'aesthetic room decor', 'canvas art for home India'],
    content: blog8,
  },
  {
    slug: 'custom-canvas-prints-anniversary-gift',
    title: 'Why Custom Canvas Prints Make the Perfect Anniversary Gift',
    excerpt: 'Looking for a meaningful anniversary gift? Discover how custom photo canvas prints capture your most precious memories as lasting wall art.',
    category: 'Gift Ideas',
    readTime: '7 min read',
    date: '2024-10-22',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    keywords: ['personalized canvas gift', 'custom photo canvas', 'anniversary gift India', 'photo collage on canvas'],
    content: blog9,
  },
  {
    slug: 'split-canvas-prints-multi-panel-display',
    title: 'Split Canvas Prints: How to Create a Stunning Multi-Panel Display',
    excerpt: 'Everything about multi-panel canvas art — from choosing the right image to hanging a perfect 3-panel or 5-panel split canvas display.',
    category: 'Guide',
    readTime: '8 min read',
    date: '2024-10-15',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
    keywords: ['split canvas prints', 'multi panel canvas', 'panoramic canvas art', 'triptych wall art India'],
    content: blog10,
  },
  {
    slug: 'eco-friendly-sustainable-canvas-prints-india',
    title: 'Eco-Friendly Decor: The Rise of Sustainable Canvas Prints in India',
    excerpt: 'Learn how eco-friendly canvas printing is revolutionizing Indian home decor — from organic cotton to water-based inks and FSC-certified frames.',
    category: 'Sustainability',
    readTime: '8 min read',
    date: '2024-10-08',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    keywords: ['eco friendly canvas prints', 'sustainable wall art', 'organic cotton canvas', 'water based ink printing'],
    content: blog11,
  },
  {
    slug: 'transforming-home-offices-wall-canvas',
    title: 'Transforming Home Offices with Inspiring Wall Canvas Art',
    excerpt: 'Boost productivity and project professionalism with strategically chosen canvas art for your home office and video call backgrounds.',
    category: 'Inspiration',
    readTime: '9 min read',
    date: '2024-09-30',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    keywords: ['home office wall art', 'canvas for office decor', 'motivational canvas prints', 'professional wall art India'],
    content: blog12,
  },
];

export default blogs;
