const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const shiprocket = require('../utils/shiprocket');

const testOrderId = process.argv[2];

if (!testOrderId) {
  console.log('Usage: node test-cancel-order.js <shiprocket_order_id>');
  process.exit(1);
}

async function testCancel() {
  try {
    console.log(`--- Testing Shiprocket Order Cancellation for SR Order ID: ${testOrderId} ---`);
    const result = await shiprocket.cancelOrder(testOrderId);
    
    if (result) {
      console.log('✅ Success! Cancellation response received:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Failed! No response returned.');
    }
  } catch (error) {
    console.error('❌ Error during cancellation test:', error.message);
  }
}

testCancel();
