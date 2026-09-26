const Lead = require('../models/Lead');
const { sendQuoteWhatsAppAlert } = require('../utils/whatsappQuoteAlert');

exports.createLead = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    const lead = await Lead.create({ name, email, phone, message });
    res.status(201).json({ message: 'Thank you! We will get back to you soon.', lead });

    // A nameplate custom-size price request (product page) also goes to the
    // team's WhatsApp. Never throws; logs its own failures.
    const { quote } = req.body;
    if (quote && typeof quote === 'object' && !Array.isArray(quote)) sendQuoteWhatsAppAlert(lead, quote);
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
