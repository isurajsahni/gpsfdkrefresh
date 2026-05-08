import React from 'react';
import InvoiceTemplate from '../components/invoice/InvoiceTemplate';

const mockDataINR = {
  invoiceNumber: 'INV-IND-0001',
  receiptNumber: 'REC-IND-0001',
  datePaid: 'May 8, 2026',
  billingPeriod: 'May 8, 2026',
  orderId: 'ORD-987654321',
  seller: {
    name: 'GPS FDK Refresh Inc.',
    addressLines: [
      'GPS, Circular Road, Near More Store,',
      'Faridkot, Punjab 151203',
      'India'
    ],
    email: 'customer@gpsfdk.com',
    phone: '+91 62803-10103',
    gstNumber: '03AABBCC1234Z1'
  },
  billTo: {
    name: 'Aarav Patel',
    email: 'aarav.patel@example.in',
    addressLines: [
      'Flat 402, Lotus Apartments',
      'Sector 43, Gurugram',
      'Haryana 122002',
      'India'
    ]
  },
  amountPaidOverview: {
    amount: '₹4,498.00',
    date: 'May 8, 2026',
    description: 'Order placed on May 8, 2026'
  },
  products: [
    { description: 'Premium Framed Canvas - 18x24', qty: 1, unitPrice: '₹2,499.00', amount: '₹2,499.00' },
    { description: 'Minimalist Wall Art Set (3 Pieces)', qty: 1, unitPrice: '₹1,499.00', amount: '₹1,499.00' },
    { description: 'Express Shipping', qty: 1, unitPrice: '₹500.00', amount: '₹500.00' }
  ],
  subtotal: '₹4,498.00',
  taxAmount: '₹0.00',
  total: '₹4,498.00',
  amountPaid: '₹4,498.00',
  paymentHistory: [
    { method: 'UPI - Google Pay', date: 'May 8, 2026', amount: '₹4,498.00', receiptNumber: 'REC-IND-0001' }
  ]
};

const mockDataUSD = {
  invoiceNumber: 'INV-USA-0002',
  receiptNumber: 'REC-USA-0002',
  datePaid: 'May 8, 2026',
  billingPeriod: 'May 8, 2026',
  orderId: 'ORD-123456789',
  seller: {
    name: 'GPS FDK Refresh Inc.',
    addressLines: [
      'GPS, Circular Road, Near More Store,',
      'Faridkot, Punjab 151203',
      'India'
    ],
    email: 'customer@gpsfdk.com',
    phone: '+91 62803-10103'
  },
  billTo: {
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    addressLines: [
      '123 Maple Street',
      'Suite 4B',
      'Austin, Texas 78701',
      'United States'
    ]
  },
  amountPaidOverview: {
    amount: '$145.00',
    date: 'May 8, 2026',
    description: 'Order placed on May 8, 2026'
  },
  products: [
    { description: 'Premium Framed Canvas - 24x36', qty: 1, unitPrice: '$120.00', amount: '$120.00' },
    { description: 'International Shipping', qty: 1, unitPrice: '$25.00', amount: '$25.00' }
  ],
  subtotal: '$145.00',
  taxAmount: '$0.00',
  total: '$145.00',
  amountPaid: '$145.00',
  paymentHistory: [
    { method: 'Visa - 2839', date: 'May 8, 2026', amount: '$145.00', receiptNumber: 'REC-USA-0002' }
  ]
};

const InvoicePreview = () => {
  return (
    <div style={{ backgroundColor: '#525659', minHeight: '100vh', padding: '60px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 500, color: '#ffffff', margin: 0, letterSpacing: '0.01em', fontFamily: 'Inter, -apple-system, sans-serif' }}>Invoice Preview</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#ffffff', opacity: 0.5, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Development Mode</span>
          <div style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
        </div>
      </div>

      {/* INR Invoice Wrapper */}
      <div style={{ maxWidth: '820px', margin: '0 auto 80px auto' }}>
        <div style={{ marginBottom: '16px', color: '#ffffff', opacity: 0.8, fontWeight: 500, fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Indian Order (INR / UPI)
        </div>
        <div style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', borderRadius: '4px', overflow: 'hidden' }}>
          <InvoiceTemplate data={mockDataINR} />
        </div>
      </div>

      {/* USD Invoice Wrapper */}
      <div style={{ maxWidth: '820px', margin: '0 auto 80px auto' }}>
        <div style={{ marginBottom: '16px', color: '#ffffff', opacity: 0.8, fontWeight: 500, fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          International Order (USD / Card)
        </div>
        <div style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', borderRadius: '4px', overflow: 'hidden' }}>
          <InvoiceTemplate data={mockDataUSD} />
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
