const Category = require('../models/Category');
const Product = require('../models/Product');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    // Whitelist allowed fields — prevent mass assignment
    const { name, description, image, isActive } = req.body;
    const category = await Category.create({ name, description, image, isActive });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    // Whitelist allowed fields — prevent mass assignment
    const { name, description, image, isActive } = req.body;

    // Use findById + save (not findByIdAndUpdate) so the pre('save') hook
    // runs and regenerates `slug` whenever `name` changes. Without this the
    // URL slug stays stale (e.g. rename "Wall Canvas" -> "Premium Canvas"
    // but the slug remains `wall-canvas`, breaking every product URL).
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    // Block deletion if any product still references this category — otherwise
    // products end up with a dangling category ObjectId and the next edit fails
    // Mongoose validation. Admin must reassign or soft-delete products first.
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product${productCount === 1 ? '' : 's'} still use${productCount === 1 ? 's' : ''} this category. Reassign or remove those products first, or set the category to inactive instead.`,
      });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category removed' });
  } catch (error) {
    next(error);
  }
};
