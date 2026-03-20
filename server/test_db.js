const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const lastProduct = await Product.findOne().sort({ createdAt: -1 }).select('name images');
    console.log(JSON.stringify(lastProduct, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
