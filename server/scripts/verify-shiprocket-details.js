const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const shiprocket = require('../utils/shiprocket');

const testOrderId = process.argv[2];

if (!testOrderId) {
  console.log('Usage: node verify-shiprocket-details.js <shiprocket_order_id>');
  process.exit(1);
}

async function verify() {
  try {
    console.log(`--- Verifying Shiprocket Order Details for ID: ${testOrderId} ---`);
    const details = await shiprocket.getOrderDetails(testOrderId);
    
    if (details) {
      console.log('✅ Success! Order details retrieved.');
      console.log('Billing Name:', details.billing_customer_name, details.billing_last_name);
      console.log('Billing Address:', details.billing_address);
      console.log('Billing Phone:', details.billing_phone);
      console.log('Shipping Details:', details.shipping_customer_name, details.shipping_last_name);
      console.log('--- Full Payload (Redacted for Security) ---');
      // console.log(JSON.stringify(details, null, 2));
    } else {
      console.error('❌ Failed! No data returned.');
    }
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verify();
