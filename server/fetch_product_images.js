const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const ProductSchema = new mongoose.Schema({
  name: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [{ url: String, public_id: String, alt: String }]
});

const CategorySchema = new mongoose.Schema({
  name: String
});

const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected! Fetching wall canvas products...');
    
    // Find Wall Canvas category
    const cat = await Category.findOne({ name: 'Wall Canvas' });
    if (!cat) {
      console.log('Wall Canvas category not found!');
      process.exit(1);
    }
    
    const products = await Product.find({ category: cat._id });
    console.log(`\nFound ${products.length} products:\n`);
    
    products.forEach((p, index) => {
      console.log(`Product ${index + 1}: ${p.name}`);
      if (p.images && p.images.length > 0) {
        console.log(`Image URL: ${p.images[0].url}`);
      } else {
        console.log('No images found!');
      }
      console.log('-----------------------------------');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
