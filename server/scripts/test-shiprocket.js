const dotenv = require('dotenv');
dotenv.config();
const shiprocket = require('../utils/shiprocket');

async function testConnection() {
  console.log('Testing Shiprocket Connection...');
  console.log('Email:', process.env.SHIPROCKET_EMAIL);
  
  try {
    const token = await shiprocket.getToken();
    console.log('✅ Connection Successful! Token received.');

    const dummyOrder = {
      orderNumber: 'TEST-' + Date.now().toString().slice(-6),
      createdAt: new Date(),
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          price: 1,
          product: { weight: 0.5 }
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
      paymentMethod: 'prepaid', // Prepaid for test
      totalPrice: 1
    };

    console.log('Creating Test Shipment...');
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
