const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create users
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@gpsfdk.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 9876543210'
    });

    await User.create({
      name: 'Demo User',
      email: 'user@gpsfdk.com',
      password: 'user123',
      role: 'user',
      phone: '+91 9876543211'
    });

    console.log('Users seeded');

    // Create categories
    const wallCanvas = await Category.create({
      name: 'Wall Canvas',
      description: 'Premium wall canvases for your home & office',
      image: { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800', public_id: '' }
    });

    const houseNameplates = await Category.create({
      name: 'House Nameplates',
      description: 'Custom luxury house nameplates',
      image: { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', public_id: '' }
    });

    console.log('Categories seeded');

    // Wall Canvas products
    const canvasProducts = [
      { name: 'The Wolf of Wall Street', desc: 'Iconic cinematic art for the ambitious soul. A bold statement piece for your workspace.', tags: ['cinema', 'motivation', 'office'] },
      { name: 'The Social Outcast', desc: 'Abstract rebellion meets modern art. Perfect for those who dare to stand apart.', tags: ['abstract', 'modern', 'living-room'] },
      { name: 'Noir Petal Sweep', desc: 'Dark botanical elegance captured in sweeping strokes of midnight and gold.', tags: ['botanical', 'dark', 'bedroom'] },
      { name: 'Azure Gaze', desc: 'Mesmerizing blue tones that evoke the calm of the endless ocean.', tags: ['blue', 'calm', 'minimal'] },
      { name: 'Dreaming in Colors', desc: 'A kaleidoscope of imagination brought to canvas. Vibrant and utterly captivating.', tags: ['colorful', 'vibrant', 'living-room'] },
      { name: 'Volcanic Core', desc: 'Raw energy captured in molten hues. A piece that commands attention.', tags: ['bold', 'red', 'office'] },
      { name: 'Obsidian Ember', desc: 'Deep charcoal meets smouldering amber in this sophisticated composition.', tags: ['dark', 'sophisticated', 'office'] },
      { name: 'The Noir Executive', desc: 'Monochrome elegance for the modern executive. Timeless confidence on canvas.', tags: ['monochrome', 'executive', 'office'] },
      { name: 'The Concrete Jungle', desc: 'Urban architecture meets artistic vision. The city as you have never seen it.', tags: ['urban', 'architecture', 'modern'] },
      { name: 'Neon Nostalgia', desc: 'Retro-futuristic vibes painted in electric neon. A conversation starter.', tags: ['neon', 'retro', 'living-room'] },
      { name: 'The Gilded Bloom', desc: 'Luxurious golden florals on a rich dark background. Pure opulence for your walls.', tags: ['floral', 'gold', 'luxury'] },
      { name: 'Celestial Frontier', desc: 'Journey through the cosmos with this stunning interstellar art piece.', tags: ['space', 'cosmic', 'bedroom'] },
    ];

    const canvasVariations = [
      { material: 'Poster', frame: 'Soft Board', size: 'A4', price: 99, comparePrice: 199 },
      { material: 'Poster', frame: 'Sticker', size: 'A3', price: 149, comparePrice: 299 },
      { material: 'Poster', frame: 'Paper', size: '12x18', price: 199, comparePrice: 399 },
      { material: 'Canvas', frame: 'Rolled', size: '18x24', price: 999, comparePrice: 1999 },
      { material: 'Canvas', frame: 'Rolled', size: '24x36', price: 1999, comparePrice: 3999 },
      { material: 'Canvas', frame: 'Stretched', size: '24x36', price: 3499, comparePrice: 5999 },
      { material: 'Canvas', frame: 'Stretched', size: '30x48', price: 4999, comparePrice: 6999 },
      { material: 'Canvas', frame: 'Stretched', size: '36x60', price: 7999, comparePrice: 9999 },
    ];

    const canvasImages = [
      'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800',
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800',
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800',
      'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800',
      'https://images.unsplash.com/photo-1574182245530-967d9b3831af?w=800',
      'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=800',
      'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=800',
      'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800',
      'https://images.unsplash.com/photo-1482160549825-59d1b23cb208?w=800',
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=800',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
    ];

    for (let i = 0; i < canvasProducts.length; i++) {
      await Product.create({
        name: canvasProducts[i].name,
        description: canvasProducts[i].desc,
        shortDescription: canvasProducts[i].desc.substring(0, 80),
        category: wallCanvas._id,
        images: [{ url: canvasImages[i], public_id: '', alt: canvasProducts[i].name }],
        variations: canvasVariations,
        featured: i < 6,
        isMasonry: i >= 4 && i < 10,
        tags: canvasProducts[i].tags,
      });
    }
    console.log('Wall Canvas products seeded');

    // House Nameplate products
    const nameplateProducts = [
      { name: 'Lord Ganesha', desc: 'Traditional Lord Ganesha design with modern metallic finish. Brings blessings to your doorstep.', colors: ['Black & Gold', 'Black & Silver'] },
      { name: 'Modern House', desc: 'Sleek geometric lines with a contemporary feel. Perfect for modern homes.', colors: ['Black & Gold', 'Black & Silver'] },
      { name: 'Silver Ganesha', desc: 'Elegant silver-toned Ganesha motif. A spiritual welcome to your abode.', colors: ['Silver & White', 'Silver & Black'] },
      { name: 'Sunehra Naam', desc: 'Golden lettering on premium acrylic. Your name in pure luxury.', colors: ['Gold & Black', 'Gold & Maroon'] },
      { name: 'Just Right', desc: 'Minimalist perfection. Clean lines, bold presence.', colors: ['Black & Gold', 'White & Gold'] },
      { name: 'House Of Gold', desc: 'Full gold treatment for the ultimate luxury statement at your entrance.', colors: ['Gold & Black', 'Gold & Brown'] },
      { name: 'Silver Circle', desc: 'Circular design with silver accents. Modern meets elegance.', colors: ['Silver & Black', 'Silver & White'] },
      { name: 'Trishula', desc: 'Sacred trident design symbolizing power and protection.', colors: ['Black & Gold', 'Black & Silver'] },
    ];

    const nameplateImages = [
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    ];

    for (let i = 0; i < nameplateProducts.length; i++) {
      const np = nameplateProducts[i];
      const variations = [];
      for (const color of np.colors) {
        variations.push({ color, size: '15 inch', price: 1999, comparePrice: 2999, stock: 50 });
        variations.push({ color, size: '18 inch', price: 2499, comparePrice: 3499, stock: 50 });
      }
      await Product.create({
        name: np.name,
        description: np.desc,
        shortDescription: np.desc.substring(0, 80),
        category: houseNameplates._id,
        images: [{ url: nameplateImages[i], public_id: '', alt: np.name }],
        variations,
        customizable: true,
        customizationLabel: 'Enter your family name',
        featured: i < 4,
        isMasonry: i >= 2 && i < 6,
        tags: ['nameplate', 'custom', 'home-decor'],
      });
    }
    console.log('House Nameplate products seeded');

    console.log('\n✅ Database seeded successfully!');
    console.log('Admin: admin@gpsfdk.com / admin123');
    console.log('User:  user@gpsfdk.com / user123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
