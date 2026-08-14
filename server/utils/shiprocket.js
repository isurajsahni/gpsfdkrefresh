const axios = require('axios');
const { getWeightBySize, getDimensionsBySize } = require('./weightMapping');

class ShiprocketService {
  constructor() {
    this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;

    // Validate credentials on startup
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      console.error('⚠️ [Shiprocket] SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not set in environment variables!');
    } else {
      console.log(`✅ [Shiprocket] Credentials loaded for: ${process.env.SHIPROCKET_EMAIL}`);
    }
  }

  async getToken() {
    // Check if token exists and is not expired (conservative 9-day check for 10-day token)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Fail fast if credentials are missing
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      throw new Error('Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in environment.');
    }

    try {
      console.log(`[Shiprocket] Authenticating with email: ${process.env.SHIPROCKET_EMAIL}`);
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Set expiry to 9 days from now
        this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
        console.log('✅ [Shiprocket] Authentication successful, token acquired.');
        return this.token;
      }
      throw new Error('Shiprocket auth response did not contain a token');
    } catch (error) {
      const errData = error.response?.data || error.message;
      console.error('❌ [Shiprocket] Login FAILED:', JSON.stringify(errData, null, 2));
      // Reset token on auth failure
      this.token = null;
      this.tokenExpiry = null;
      throw new Error(`Shiprocket authentication failed: ${typeof errData === 'object' ? JSON.stringify(errData) : errData}`);
    }
  }

  // Run an authed request; on a 401 (token rejected / expired early) force a
  // fresh login and retry once. Without this a stale cached token locks out all
  // Shiprocket calls until the 9-day local expiry or a container restart (F3).
  async _authedRequest(fn) {
    let token = await this.getToken();
    try {
      return await fn(token);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('[Shiprocket] 401 — token rejected; re-authenticating and retrying once');
        this.token = null;
        this.tokenExpiry = null;
        token = await this.getToken();
        return await fn(token);
      }
      throw error;
    }
  }

  async createShipment(order) {
    try {
      // ─── Auto Weight & Dimension Calculation from Product Size ───
      let totalWeight = 0;
      let maxLength = 0, maxBreadth = 0, maxHeight = 0;

      // ─── Coupon/discount reconciliation (COD over-collection fix) ───
      // Shiprocket derives the collectable amount (what the courier charges the
      // customer on COD) from the order_items line totals, NOT from sub_total.
      // Sending every item at full selling_price with discount:0 while a coupon
      // reduced the order makes Shiprocket collect the FULL pre-discount amount
      // (e.g. ₹3000) instead of what the customer actually owes (e.g. ₹400).
      // So distribute the order-level discount across the lines proportionally
      // via each item's `discount` field. The last line absorbs any rounding
      // remainder so the sum of line discounts equals order.discountPrice exactly.
      const lineGross = order.items.map(
        (it) => (Number(it.price) || 0) * (Number(it.quantity) || 0)
      );
      const totalGross = lineGross.reduce((a, b) => a + b, 0);
      // Never discount below the line's own value; never exceed the goods total.
      const cappedDiscount = Math.min(
        Math.max(0, Number(order.discountPrice) || 0),
        totalGross
      );
      let discountAllocated = 0;
      const lineDiscounts = lineGross.map((gross, i) => {
        let d;
        if (i === lineGross.length - 1) {
          d = +(cappedDiscount - discountAllocated).toFixed(2); // absorb rounding
        } else if (totalGross > 0) {
          d = +((cappedDiscount * gross) / totalGross).toFixed(2);
          discountAllocated += d;
        } else {
          d = 0;
        }
        return Math.min(Math.max(d, 0), gross); // clamp to [0, line value]
      });

      const orderItems = order.items.map((item, idx) => {
        // Get the variation size from the order item
        const size = item.variation?.size || '';

        // Auto-calculate weight from size mapping
        const unitWeight = getWeightBySize(size);
        const itemWeight = unitWeight * item.quantity;
        totalWeight += itemWeight;

        // Track max dimensions (package must fit the largest item)
        const dims = getDimensionsBySize(size);
        maxLength = Math.max(maxLength, dims.length);
        maxBreadth = Math.max(maxBreadth, dims.breadth);
        maxHeight = Math.max(maxHeight, dims.height);

        console.log(`[Shiprocket] Item: "${item.name}" | Size: "${size}" | Weight: ${unitWeight}kg x ${item.quantity} = ${itemWeight}kg`);

        return {
          name: item.name,
          sku: item.variation?.sku || item.product?._id?.toString() || `SKU-${Date.now()}`,
          units: item.quantity,
          selling_price: item.price,
          discount: lineDiscounts[idx],
          tax: 0,
          hsn: 0,
        };
      });

      // Split name safely
      const full_name = order.shippingAddress.fullName || 'Customer';
      const nameParts = full_name.trim().split(' ');
      const billing_customer_name = nameParts[0];
      const billing_last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Customer';

      // Ensure minimum viable weight & dimensions
      const finalWeight = Math.max(totalWeight, 0.5);
      const finalLength = Math.max(maxLength, 10);
      const finalBreadth = Math.max(maxBreadth, 10);
      const finalHeight = Math.max(maxHeight, 5);

      // Clean phone number — Shiprocket requires 10-digit Indian number
      let phone = (order.shippingAddress.phone || order.guestPhone || '').toString().trim();
      phone = phone.replace(/[^0-9]/g, ''); // strip non-digits
      if (phone.length > 10) phone = phone.slice(-10); // take last 10 digits

      // Resolve customer email — registered-user orders keep it on the User doc,
      // not order.guestEmail. Without this lookup Shiprocket records the
      // 'customer@gpsfdk.com' placeholder for every logged-in customer (F2).
      let customerEmail = order.guestEmail || '';
      if (!customerEmail && order.user) {
        try {
          const User = require('../models/User');
          const u = await User.findById(order.user).select('email');
          customerEmail = u?.email || '';
        } catch (_) { /* fall back to placeholder below */ }
      }

      const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Home';

      const payload = {
        order_id: order.orderNumber,
        order_date: new Date(order.createdAt).toISOString().split('T')[0],
        pickup_location: pickupLocation,
        billing_customer_name,
        billing_last_name,
        billing_address: order.shippingAddress.addressLine1,
        billing_address_2: order.shippingAddress.addressLine2 || '',
        billing_city: order.shippingAddress.city,
        billing_pincode: order.shippingAddress.pincode,
        billing_state: order.shippingAddress.state,
        billing_country: order.shippingAddress.country || 'India',
        billing_email: customerEmail || 'support@gpsfdk.com',
        billing_phone: phone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: order.totalPrice,
        length: finalLength,
        breadth: finalBreadth,
        height: finalHeight,
        weight: finalWeight,
      };

      console.log(`[Shiprocket] Creating order ${order.orderNumber} → Weight: ${finalWeight}kg | Dims: ${finalLength}x${finalBreadth}x${finalHeight}cm | Pickup: "${pickupLocation}" | Phone: ${phone}`);
      console.log(`[Shiprocket] Full payload:`, JSON.stringify(payload, null, 2));

      const response = await this._authedRequest((token) => axios.post(
        `${this.baseUrl}/orders/create/adhoc`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      ));

      console.log(`✅ [Shiprocket] API Response for ${order.orderNumber}:`, JSON.stringify(response.data, null, 2));

      // Validate response
      if (response.data && (response.data.order_id || response.data.shipment_id)) {
        return response.data;
      } else {
        console.error(`❌ [Shiprocket] Unexpected response structure:`, JSON.stringify(response.data, null, 2));
        throw new Error(`Shiprocket returned unexpected response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      // Extract detailed error info from Shiprocket API
      if (error.response) {
        const data = error.response.data;
        let detailMsg = '';
        if (typeof data === 'string') {
          detailMsg = data;
        } else if (data && data.message) {
          detailMsg = data.message;
          if (data.errors) {
            detailMsg += ' - ' + (typeof data.errors === 'object' ? JSON.stringify(data.errors) : data.errors);
          }
        } else {
          detailMsg = JSON.stringify(data);
        }
        console.error(`❌ [Shiprocket] API Error (HTTP ${error.response.status}):`, JSON.stringify(data, null, 2));
        throw new Error(`Shiprocket API Error (${error.response.status}): ${detailMsg}`);
      }
      console.error('❌ [Shiprocket] Create Order Error:', error.message);
      throw error;
    }
  }

  async getTracking(awbCode) {
    try {
      const response = await this._authedRequest((token) => axios.get(
        `${this.baseUrl}/courier/track/awb/${awbCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`❌ [Shiprocket] Tracking Error (HTTP ${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('❌ [Shiprocket] Tracking Error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Fetch full order details from Shiprocket
   * Endpoint: /v1/external/orders/show/{order_id}
   */
  async getOrderDetails(shiprocketOrderId) {
    try {
      console.log(`[Shiprocket] Fetching details for SR Order ID: ${shiprocketOrderId}`);

      const response = await this._authedRequest((token) => axios.get(
        `${this.baseUrl}/orders/show/${shiprocketOrderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ));

      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`❌ [Shiprocket] Get Order Details Error (HTTP ${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
        throw new Error(`Shiprocket API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      console.error('❌ [Shiprocket] Get Order Details Error:', error.message);
      throw error;
    }
  }

  /**
   * Cancel an order in Shiprocket
   * Endpoint: POST /v1/external/orders/cancel
   */
  async cancelOrder(shiprocketOrderId) {
    try {
      console.log(`[Shiprocket] Cancelling SR Order ID: ${shiprocketOrderId}`);

      const response = await this._authedRequest((token) => axios.post(
        `${this.baseUrl}/orders/cancel`,
        { ids: [Number(shiprocketOrderId)] },
        { headers: { Authorization: `Bearer ${token}` } }
      ));

      console.log(`✅ [Shiprocket] Order Cancellation API Response for ID ${shiprocketOrderId}:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`❌ [Shiprocket] Order Cancellation Error (HTTP ${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
        throw new Error(`Shiprocket API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      console.error('❌ [Shiprocket] Order Cancellation Error:', error.message);
      throw error;
    }
  }
}

module.exports = new ShiprocketService();

