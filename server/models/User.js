const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
  // Optional user-facing tag for the address (e.g. 'Home', 'Work'). Shown on the
  // app's checkout bar; previously the app kept this on-device for lack of a field.
  label: { type: String, default: '', trim: true, maxlength: 30 }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 8 },
  role: { type: String, enum: ['user', 'admin', 'marketing', 'admin_marketing', 'order_manager', 'coupon_manager'], default: 'user' },
  phone: { type: String, default: '' },
  addresses: [addressSchema],
  avatar: { type: String, default: '' },
  // Cloudinary public_id of the CURRENT uploaded avatar, set server-side from
  // the upload result — never from client input. Deletion of the previous
  // avatar keys off this field, so a client-supplied `avatar` string can no
  // longer steer cloudinary.uploader.destroy() at an arbitrary asset.
  avatarPublicId: { type: String, default: '' },
  resetPasswordOtp: String,
  resetPasswordExpire: Date,
  otpAttempts: { type: Number, default: 0 },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  // Self-serve account deletion (Apple 5.1.1(v)). We anonymise rather than
  // hard-delete: the user document is kept so their Order.user references stay
  // valid (GST / accounting records must survive), but every personal field is
  // overwritten and this timestamp is set. A non-null deletedAt excludes the
  // account from login (via `protect`) and from admin user lists.
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Mongoose 7+ async hooks do NOT receive next() — just use async/await
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
