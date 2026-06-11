const mongoose = require('mongoose');
const slugify = require('slugify');

const variationSchema = new mongoose.Schema({
  material: { type: String, default: '' },
  frame: { type: String, default: '' },
  size: { type: String, required: true },
  color: { type: String, default: '' },
  price: { type: Number, required: true },
  comparePrice: { type: Number, default: 0 },
  // Internal making/ingredient cost — never exposed on public product APIs,
  // snapshotted into order items at checkout for margin reporting.
  costPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 100 },
  sku: { type: String, default: '' }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: String, trim: true },
  images: [{ url: String, public_id: String, alt: String }],
  thumbnailImage: { url: String, public_id: String },
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
  weight: { type: Number, default: 0.5 },
  length: { type: Number, default: 10 },
  breadth: { type: Number, default: 10 },
  height: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.pre('save', async function () {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    
    // Check if slug exists in DB (excluding current product)
    while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }
  
  if (this.variations && this.variations.length > 0) {
    this.basePrice = Math.min(...this.variations.map(v => v.price));
  }
});

// ─── Indexes ───
// Most catalogue queries filter by isActive + sort by createdAt; this is the
// hottest path (`getProducts`), so a compound index covers both.
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isMasonry: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ tags: 1 });
// Text index for name+description search (currently uses regex collection scans).
// Switch the controller to `$text` once content is verified.
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
