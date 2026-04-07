const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const shiprocket = require('../utils/shiprocket');

async function test() {
  try {
    console.log('--- Testing Shiprocket Login ---');
    console.log('Using email:', process.env.SHIPROCKET_EMAIL);
    const token = await shiprocket.getToken();
    if (token) {
      console.log('✅ Login successful! Token received.');
    } else {
      console.error('❌ Login failed! No token received.');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
}

test();
