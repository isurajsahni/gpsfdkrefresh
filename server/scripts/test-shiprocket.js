const dotenv = require('dotenv');
dotenv.config();
const shiprocket = require('../utils/shiprocket');
const { getWeightBySize, getDimensionsBySize, WEIGHT_MAP } = require('../utils/weightMapping');

async function testConnection() {
  // ─── Step 1: Test Weight Mapping ───
  console.log('\n══════════════════════════════════════');
  console.log('  WEIGHT MAPPING VERIFICATION');
  console.log('══════════════════════════════════════\n');

  for (const [size, weight] of Object.entries(WEIGHT_MAP)) {
    const dims = getDimensionsBySize(size);
    console.log(`  ${size.padEnd(8)} → ${weight}kg | ${dims.length}x${dims.breadth}x${dims.height}cm`);
  }

  // Test edge cases
  console.log('\n  Edge Cases:');
  console.log(`  "unknown" → ${getWeightBySize('unknown')}kg (default)`);
  console.log(`  ""        → ${getWeightBySize('')}kg (default)`);
  console.log(`  "12 x 18" → ${getWeightBySize('12 x 18')}kg (normalized)`);

  // ─── Step 2: Test Shiprocket Connection ───
  console.log('\n══════════════════════════════════════');
  console.log('  SHIPROCKET CONNECTION TEST');
  console.log('══════════════════════════════════════\n');
  console.log('Email:', process.env.SHIPROCKET_EMAIL);
  
  try {
    const token = await shiprocket.getToken();
    console.log('✅ Connection Successful! Token received.');

    const dummyOrder = {
      orderNumber: 'TEST-' + Date.now().toString().slice(-6),
      createdAt: new Date(),
      items: [
        {
          name: 'Test Canvas 24x36',
          quantity: 1,
          price: 1,
          variation: { size: '24x36' },
        }
      ],
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: 'Test Address 123',
        city: 'Mumbai',
        pincode: '400001',
        state: 'Maharashtra',
        country: 'India',
        phone: '9876543210'
      },
      paymentMethod: 'prepaid',
      totalPrice: 1
    };

    console.log('\nCreating Test Shipment (size: 24x36 → expected 4.2kg)...');
    const result = await shiprocket.createShipment(dummyOrder);
    
    if (result && result.order_id) {
      console.log('✅ Shipment Order Created Successfully!');
      console.log('Shiprocket Order ID:', result.order_id);
      console.log('Shipment ID:', result.shipment_id);
      console.log('AWB Code:', result.awb_code || 'Pending');
    } else {
      console.log('❌ Shipment creation failed. Response:', result);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
  }
}

testConnection();

