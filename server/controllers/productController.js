const Product = require('../models/Product');
const Category = require('../models/Category');
const csv = require('csv-parser');
const fs = require('fs');
const slugify = require('slugify');
const { cloudinary } = require('../middleware/upload');

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
      productData.images = req.files.map(f => {
        // multer-storage-cloudinary v4: secure_url is on f.path, public_id is on f.filename
        const url = f.secure_url || f.path || f.url;
        const public_id = f.public_id || f.filename;
        console.log('Uploaded image:', { url, public_id, originalPath: f.path });
        return { url, public_id };
      });
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
      ? req.files.map(f => {
          const url = f.secure_url || f.path || f.url;
          const public_id = f.public_id || f.filename;
          console.log('Uploaded image (update):', { url, public_id, originalPath: f.path });
          return { url, public_id };
        })
      : [];

    product.images = [...keptImages, ...newImages];

    // Find images that were removed and delete them from Cloudinary
    if (product.images.length >= 0) { // To run safely
      const keptPublicIds = keptImages.map(img => img.public_id).filter(Boolean);
      const removedImages = product._doc.images || []; // Access original images from previous state

      for (const img of removedImages) {
        if (img.public_id && !keptPublicIds.includes(img.public_id)) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error(`Failed to delete image ${img.public_id} from Cloudinary:`, err);
          }
        }
      }
    }

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
    
    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error(`Failed to delete image ${img.public_id} from Cloudinary:`, err);
          }
        }
      }
    }

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

    // Find all products to get their image public_ids
    const products = await Product.find({ _id: { $in: ids } });
    
    // Delete all associated images from Cloudinary
    for (const product of products) {
      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          if (img.public_id) {
            try {
              await cloudinary.uploader.destroy(img.public_id);
            } catch (err) {
              console.error(`Failed to delete image ${img.public_id} from Cloudinary:`, err);
            }
          }
        }
      }
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

          // Helper: normalize a row so keys are trimmed & lowercased
          const normalizeRow = (row) => {
            const normalized = {};
            for (const key of Object.keys(row)) {
              normalized[key.trim().toLowerCase()] = row[key];
            }
            return normalized;
          };

          // Helper: parse a number that may contain commas (e.g. "4,500")
          const parseNum = (val, fallback = 0) => {
            if (val === undefined || val === null || val === '') return fallback;
            const cleaned = String(val).replace(/,/g, '').trim();
            const num = Number(cleaned);
            return isNaN(num) ? fallback : num;
          };

          // Helper: get a value from the normalized row, trying multiple key variants
          const getField = (r, ...keys) => {
            for (const k of keys) {
              const val = r[k.toLowerCase().trim()];
              if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
            }
            return '';
          };

          for (const [index, rawRow] of results.entries()) {
            const row = normalizeRow(rawRow);

            // Map WooCommerce or Standard fields
            const name = getField(row, 'name', 'post title');
            if (!name) {
              console.log(`Row ${index + 1}: Skipped – no product name found. Keys:`, Object.keys(rawRow).join(', '));
              continue;
            }

            const description = getField(row, 'description', 'post content');
            const categoryName = getField(row, 'category', 'categories') || 'General';
            const sku = getField(row, 'sku');
            const type = getField(row, 'type') || 'simple';
            
            // Images (WooCommerce images are often comma-separated URLs)
            const imageUrlsStr = getField(row, 'images');
            const imageUrls = imageUrlsStr ? imageUrlsStr.split(',').map(u => u.trim()).filter(u => u.startsWith('http')) : [];

            // Variation Data
            const variation = {
              sku: sku,
              price: parseNum(row['regular price'] || row['price'], 0),
              comparePrice: parseNum(row['sale price'] || row['compareprice'], 0),
              stock: parseNum(row['stock'], 100),
              size: getField(row, 'size', 'attribute 1 value(s)', 'attribute 1 value') || 'Standard',
              material: getField(row, 'material', 'attribute 2 value(s)', 'attribute 2 value'),
              frame: getField(row, 'frame', 'attribute 3 value(s)', 'attribute 3 value'),
              color: getField(row, 'color', 'attribute 4 value(s)', 'attribute 4 value')
            };

            if (!productsMap.has(name)) {
              productsMap.set(name, {
                name,
                description,
                categoryName,
                imageUrls,
                featured: ['true', '1'].includes((row['featured'] || row['isfeatured'] || '').toLowerCase()),
                isMasonry: ['true', '1'].includes((row['ismasonry'] || '').toLowerCase()),
                customizable: ['true', '1'].includes((row['customizable'] || '').toLowerCase()),
                variations: [variation]
              });
            } else if (type.toLowerCase().includes('variation')) {
              // Add to existing product's variations
              productsMap.get(name).variations.push(variation);
            }
          }

          let importedCount = 0;
          let errorCount = 0;
          const Category = require('../models/Category');

          for (const [name, pData] of productsMap.entries()) {
            try {
              // Find or Create Category
              let category = await Category.findOne({ 
                $or: [{ name: new RegExp(`^${pData.categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, { slug: pData.categoryName.trim().toLowerCase() }]
              });
              
              if (!category) {
                category = new Category({ name: pData.categoryName });
                await category.save();
              }

              // Check if product with this name already exists
              let product = await Product.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

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
                    if (newVar.comparePrice) exists.comparePrice = newVar.comparePrice;
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
            } catch (productError) {
              console.error(`Failed to import product "${name}":`, productError.message);
              errorCount++;
            }
          }

          // Clean up uploaded file
          try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

          const message = importedCount > 0
            ? `Successfully imported ${importedCount} product(s) with their variations`
            : 'No products were imported. Please check your CSV column headers (expected: Name, Regular price, Categories, etc.)';

          res.status(importedCount > 0 ? 201 : 200).json({ 
            message,
            count: importedCount,
            skippedRows: results.length - [...productsMap.values()].reduce((sum, p) => sum + p.variations.length, 0),
            errors: errorCount
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
