const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    // Load User model
    const User = require('./models/User');
    const users = await User.find({}, 'name email role resetPasswordOtp resetPasswordExpire createdAt');
    console.log('\n--- Registered Users ---');
    users.forEach(u => {
      console.log(`Email: ${u.email} | Name: ${u.name} | HasOTP: ${!!u.resetPasswordOtp}`);
    });
    console.log('------------------------\n');
    process.exit(0);
  } catch (err) {
    console.error('Failed', err);
    process.exit(1);
  }
};

connectDB();
