const Product = require('../models/Product');
const Category = require('../models/Category');
const csv = require('csv-parser');
const fs = require('fs');
const slugify = require('slugify');

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { category, categorySlug, featured, search, sort, page = 1, limit = 20, masonry } = req.query;
    const query = { isActive: true };
    
    if (category) query.category = category;
    
    if (categorySlug) {
      const Category = require('../models/Category');
      const cat = await Category.findOne({ slug: categorySlug });
      if (cat) {
        query.category = cat._id;
      } else {
        // If category slug is requested but doesn't exist, return no products
        return res.json({ products: [], total: 0, pages: 0, page: 1 });
      }
    }

    if (featured === 'true') query.featured = true;
    if (masonry === 'true') query.isMasonry = true;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { basePrice: 1 };
    if (sort === 'price_desc') sortObj = { basePrice: -1 };
    if (sort === 'name') sortObj = { name: 1 };
    
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({ products, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products (admin)
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(f => ({ url: f.path, public_id: f.filename }));
    }
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/products/:id (admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    Object.assign(product, req.body);
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => ({ url: f.path, public_id: f.filename }));
      product.images = [...product.images, ...newImages];
    }
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/products/:id (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products/import (admin)
exports.importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const importedProducts = [];
          for (const row of results) {
            // Find or create category based on name/slug in CSV
            // Map common fields
            let categoryId;
            if (row.category) {
              const cat = await Category.findOne({ 
                $or: [
                  { name: new RegExp(`^${row.category}$`, 'i') },
                  { slug: row.category.toLowerCase() }
                ]
              });
              if (cat) categoryId = cat._id;
            }

            if (!categoryId) {
              // Fallback to a default category or skip? Let's skip if no category for now or create "General"
              const general = await Category.findOne({ name: /General/i }) || await Category.findOne();
              categoryId = general ? general._id : null;
            }

            if (!categoryId) continue;

            const productData = {
              name: row.name,
              description: row.description || '',
              category: categoryId,
              subCategory: row.subCategory || '',
              featured: row.featured === 'true' || row.featured === '1',
              isMasonry: row.isMasonry === 'true' || row.isMasonry === '1',
              customizable: row.customizable === 'true' || row.customizable === '1',
              variations: [
                {
                  size: row.size || 'Standard',
                  price: Number(row.price) || 0,
                  stock: Number(row.stock) || 100,
                  material: row.material || '',
                  frame: row.frame || '',
                  color: row.color || ''
                }
              ]
            };

            const product = new Product(productData);
            await product.save();
            importedProducts.push(product);
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.status(201).json({ 
            message: `Successfully imported ${importedProducts.length} products`,
            count: importedProducts.length 
          });
        } catch (innerError) {
          res.status(500).json({ message: 'Error processing CSV rows: ' + innerError.message });
        }
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
