const axios = require('axios');

class ShiprocketService {
  constructor() {
    this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    // Check if token exists and is not expired (conservative 9-day check for 10-day token)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Set expiry to 9 days from now
        this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
        return this.token;
      }
      throw new Error('Failed to get Shiprocket token');
    } catch (error) {
      console.error('Shiprocket Login Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async createShipment(order) {
    try {
      const token = await this.getToken();
      
      // Map order items and calculate total weight
      let totalWeight = 0;
      const orderItems = order.items.map(item => {
        const itemWeight = (item.product?.weight || 0.5) * item.quantity;
        totalWeight += itemWeight;
        return {
          name: item.name,
          sku: item.variation?.sku || item.product?._id || 'SKU-001',
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
          hsn: 0,
        };
      });

      // Split name safely
      const full_name = order.shippingAddress.fullName || 'Customer';
      const nameParts = full_name.trim().split(' ');
      const billing_customer_name = nameParts[0];
      const billing_last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Customer';

      const payload = {
        order_id: order.orderNumber,
        order_date: new Date(order.createdAt).toISOString().split('T')[0],
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
        billing_customer_name,
        billing_last_name,
        billing_address: order.shippingAddress.addressLine1,
        billing_address_2: order.shippingAddress.addressLine2 || '',
        billing_city: order.shippingAddress.city,
        billing_pincode: order.shippingAddress.pincode,
        billing_state: order.shippingAddress.state,
        billing_country: order.shippingAddress.country || 'India',
        billing_email: order.guestEmail || 'customer@gpsfdk.com',
        billing_phone: order.shippingAddress.phone || order.guestPhone || '',
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: order.totalPrice,
        length: 10, // Defaults, would usually take from first product or max dimensions
        breadth: 10,
        height: 10,
        weight: Math.max(totalWeight, 0.5),
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/create/adhoc`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error) {
      console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getTracking(awbCode) {
    try {
      const token = await this.getToken();
      const response = await axios.get(
        `${this.baseUrl}/courier/track/awb/${awbCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Shiprocket Tracking Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new ShiprocketService();
