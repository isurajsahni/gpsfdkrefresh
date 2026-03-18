const Lead = require('../models/Lead');

exports.createLead = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    const lead = await Lead.create({ name, email, phone, message });
    res.status(201).json({ message: 'Thank you! We will get back to you soon.', lead });
  } catch (error) {
    next(error);
  }
};

exports.getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({}).sort('-createdAt');
    res.json(leads);
  } catch (error) {
    next(error);
  }
};
