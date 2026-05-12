const Coupon = require('../models/Coupon');

// @desc    Create a regular coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, maxUsers, maxUsesPerUser, expiryDate, isActive, assignedTo } = req.body;
    
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ message: 'Coupon already exists' });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscountAmount: maxDiscountAmount || 0,
      maxUsers: maxUsers || 100,

      maxUsesPerUser: maxUsesPerUser || 1,
      expiryDate,
      isActive: isActive !== undefined ? isActive : true,
      assignedTo: assignedTo || null,

    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    await coupon.deleteOne();
    res.json({ message: 'Coupon removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const userId = req.user ? req.user._id : null;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });


    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Coupon is no longer active' });
    }

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value of ₹${coupon.minOrderValue} required` });
    }

    // Check usage limits
    if (userId) {
      const userUsage = coupon.usageHistory.find(u => u.userId && u.userId.toString() === userId.toString());
      const totalUniqueUsers = coupon.usageHistory.length;

      if (!userUsage && totalUniqueUsers >= coupon.maxUsers) {
        return res.status(400).json({ message: 'This coupon has reached its maximum user limit' });
      }

      if (userUsage && userUsage.useCount >= coupon.maxUsesPerUser) {
        return res.status(400).json({ message: 'You have reached the maximum usage limit for this coupon' });
      }
    } else {
      if (coupon.usageHistory.length >= coupon.maxUsers) {
        return res.status(400).json({ message: 'This coupon has reached its maximum user limit' });
      }
    }


    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      calculatedDiscount = (orderTotal * coupon.discountValue) / 100;
      // Cap percentage discount if maxDiscountAmount is set
      if (coupon.maxDiscountAmount > 0 && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
    } else {
      calculatedDiscount = coupon.discountValue;
    }

    // FINAL SAFETY: Discount must NOT exceed subtotal
    calculatedDiscount = Math.min(calculatedDiscount, orderTotal);

    res.json({
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      calculatedDiscount,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin/CouponManager
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const { 
      code, 
      discountType, 
      discountValue, 
      minOrderValue, 
      maxDiscountAmount, 
      maxUsers, 
      maxUsesPerUser, 
      expiryDate, 
      isActive, 
      assignedTo 
    } = req.body;

    if (code) coupon.code = code.toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (maxUsers !== undefined) coupon.maxUsers = maxUsers;
    if (maxUsesPerUser !== undefined) coupon.maxUsesPerUser = maxUsesPerUser;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (assignedTo !== undefined) coupon.assignedTo = assignedTo;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coupon usage details
// @route   GET /api/coupons/usage
// @access  Private/Admin/CouponManager
const getAllCouponUsage = async (req, res) => {
  try {
    const CouponUsage = require('../models/CouponUsage');
    const usages = await CouponUsage.find({})
      .populate('couponId', 'code')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(usages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getAllCouponUsage,
};
