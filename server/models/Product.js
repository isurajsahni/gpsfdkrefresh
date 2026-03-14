const mongoose = require('mongoose');
const slugify = require('slugify');

const variationSchema = new mongoose.Schema({
  material: { type: String, default: '' },
  frame: { type: String, default: '' },
  size: { type: String, required: true },
  color: { type: String, default: '' },
  price: { type: Number, required: true },
  comparePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 100 },
  sku: { type: String, default: '' }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ url: String, public_id: String, alt: String }],
  videos: [{ url: String, public_id: String }],
  variations: [variationSchema],
  basePrice: { type: Number, default: 0 },
  customizable: { type: Boolean, default: false },
  customizationLabel: { type: String, default: 'Custom Text' },
  featured: { type: Boolean, default: false },
  isMasonry: { type: Boolean, default: false },
  tags: [String],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.variations.length > 0 && !this.basePrice) {
    this.basePrice = Math.min(...this.variations.map(v => v.price));
  }
});

productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ tags: 1 });

module.exports = mongoose.model('Product', productSchema);
