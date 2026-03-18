const Product = require('../models/Product');
const Category = require('../models/Category');
const csv = require('csv-parser');
const fs = require('fs');
const slugify = require('slugify');

/**
 * Generates a unique slug for a product
 * @param {string} name - Product name
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (name) => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;
  
  // Check if slug exists in DB
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }
  
  return slug;
};

// GET /api/products
exports.getProducts = async (req, res, next) => {
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
    next(error);
  }
};

// GET /api/products/:slug
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// POST /api/products (admin)
exports.createProduct = async (req, res, next) => {
  try {
    // Parse variations from FormData string
    let variations = req.body.variations;
    if (typeof variations === 'string') {
      variations = JSON.parse(variations);
    }

    // Parse boolean fields (FormData sends them as strings)
    const parseBool = (val) => val === 'true' || val === true;

    const productData = {
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
      subCategory: req.body.subCategory || '',
      customizable: parseBool(req.body.customizable),
      customizationLabel: req.body.customizationLabel || 'Custom Text',
      featured: parseBool(req.body.featured),
      isMasonry: parseBool(req.body.isMasonry),
      variations: variations || [],
      images: [],
    };

    // Use uploaded files for images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(f => ({ url: f.path, public_id: f.filename }));
    }

    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id (admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Parse boolean fields (FormData sends them as strings)
    const parseBool = (val) => val === 'true' || val === true;

    // Update scalar fields explicitly
    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.category !== undefined) product.category = req.body.category;
    if (req.body.subCategory !== undefined) product.subCategory = req.body.subCategory;
    if (req.body.customizable !== undefined) product.customizable = parseBool(req.body.customizable);
    if (req.body.customizationLabel !== undefined) product.customizationLabel = req.body.customizationLabel;
    if (req.body.featured !== undefined) product.featured = parseBool(req.body.featured);
    if (req.body.isMasonry !== undefined) product.isMasonry = parseBool(req.body.isMasonry);

    // Parse variations
    if (typeof req.body.variations === 'string') {
      product.variations = JSON.parse(req.body.variations);
    } else if (Array.isArray(req.body.variations)) {
      product.variations = req.body.variations;
    }

    // Handle images: start with existing images the frontend says to keep
    let keptImages = [];
    if (req.body.existingImages) {
      try {
        keptImages = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
      } catch (e) {
        keptImages = [];
      }
    }

    // Append newly uploaded files
    const newImages = (req.files && req.files.length > 0)
      ? req.files.map(f => ({ url: f.path, public_id: f.filename }))
      : [];

    product.images = [...keptImages, ...newImages];

    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id (admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/bulk-delete (admin)
exports.bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided' });
    }
    const result = await Product.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} product(s) deleted`, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/import (admin)
exports.importProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('error', (err) => {
        console.error('CSV Parsing Error:', err);
        next(err);
      })
      .on('end', async () => {
        console.log('CSV Parsing Complete. Processing', results.length, 'rows');
        try {
          const productsMap = new Map();
          const { cloudinary } = require('../middleware/upload');

          for (const [index, row] of results.entries()) {
            // Map WooCommerce or Standard fields
            const name = (row.name || row.Name || row['Post Title'])?.trim();
            if (!name) continue;

            const description = row.description || row.Description || row['Post Content'] || '';
            const categoryName = row.category || row.Categories || 'General';
            const sku = row.sku || row.SKU || '';
            const type = row.type || row.Type || 'simple'; // 'simple' or 'variable' or 'variation'
            
            // Images (WooCommerce images are often comma-separated URLs)
            const imageUrlsStr = row.images || row.Images || '';
            const imageUrls = imageUrlsStr.split(',').map(u => u.trim()).filter(u => u.startsWith('http'));

            // Variation Data
            const variation = {
              sku: sku,
              price: Number(row.price || row['Regular price'] || 0),
              comparePrice: Number(row.comparePrice || row['Sale price'] || 0),
              stock: Number(row.stock || row.Stock || 100),
              size: row.size || row['Attribute 1 value(s)'] || row['Attribute 1 value'] || 'Standard',
              material: row.material || row['Attribute 2 value(s)'] || '',
              frame: row.frame || row['Attribute 3 value(s)'] || '',
              color: row.color || row['Attribute 4 value(s)'] || ''
            };

            if (!productsMap.has(name)) {
              productsMap.set(name, {
                name,
                description,
                categoryName,
                imageUrls,
                featured: row.featured === 'true' || row.featured === '1' || row.IsFeatured === '1',
                isMasonry: row.isMasonry === 'true' || row.isMasonry === '1',
                customizable: row.customizable === 'true' || row.customizable === '1',
                variations: [variation]
              });
            } else if (type.toLowerCase().includes('variation')) {
              // Add to existing product's variations
              productsMap.get(name).variations.push(variation);
            }
          }

          let importedCount = 0;
          const Category = require('../models/Category');

          for (const [name, pData] of productsMap.entries()) {
            // Find or Create Category
            let category = await Category.findOne({ 
              $or: [{ name: new RegExp(`^${pData.categoryName.trim()}$`, 'i') }, { slug: pData.categoryName.trim().toLowerCase() }]
            });
            
            if (!category) {
              category = new Category({ name: pData.categoryName });
              await category.save();
            }

            // Check if product with this name already exists
            let product = await Product.findOne({ name: new RegExp(`^${name}$`, 'i') });

            // Upload Images to Cloudinary if they are URLs
            const finalImages = [];
            if (pData.imageUrls.length > 0) {
              for (const url of pData.imageUrls) {
                try {
                  const result = await cloudinary.uploader.upload(url, {
                    folder: 'gpsfdk/imported',
                    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
                  });
                  finalImages.push({ url: result.secure_url, public_id: result.public_id });
                } catch (imgErr) {
                  console.error(`Failed to upload image from URL: ${url}`, imgErr.message);
                }
              }
            }

            if (product) {
              // Update existing product: merge variations and images
              console.log(`Updating existing product: ${name}`);
              
              // Only add new variations (simple check by size/material)
              for (const newVar of pData.variations) {
                const exists = product.variations.find(v => v.size === newVar.size && v.material === newVar.material);
                if (!exists) {
                  product.variations.push(newVar);
                } else {
                  // Update price/stock if it exists
                  exists.price = newVar.price;
                  exists.stock = newVar.stock;
                }
              }
              
              if (finalImages.length > 0) {
                product.images = [...product.images, ...finalImages];
              }
              
              await product.save();
            } else {
              // Create new product with unique slug
              console.log(`Creating new product: ${name}`);
              const uniqueSlug = await generateUniqueSlug(name);
              
              product = new Product({
                name: pData.name,
                description: pData.description,
                slug: uniqueSlug,
                category: category._id,
                variations: pData.variations,
                featured: pData.featured,
                isMasonry: pData.isMasonry,
                customizable: pData.customizable,
                images: finalImages
              });
              await product.save();
            }
            importedCount++;
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.status(201).json({ 
            message: `Successfully imported ${productsMap.size} products with their variations`,
            count: productsMap.size 
          });
        } catch (innerError) {
          console.error('Import Error:', innerError);
          next(innerError);
        }
      });
  } catch (error) {
    next(error);
  }
};
