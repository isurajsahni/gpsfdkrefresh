const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  image: { url: String, public_id: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.pre('save', function () {
  // Generate slug on insert (isNew) OR on rename (isModified('name')).
  // Without the isNew guard, edge-case insert paths that pre-fill `slug`
  // could skip slugify and leave a mismatched/missing slug, which breaks
  // /api/categories/:slug lookups in the frontend.
  if (this.isNew || this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

module.exports = mongoose.model('Category', categorySchema);
