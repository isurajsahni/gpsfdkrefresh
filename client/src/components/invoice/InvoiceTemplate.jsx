import React from 'react';
import './invoice.css';
import logo from '../../assets/vite.webp';

/**
 * Reusable Production-Ready Invoice Component
 * Accepts a pure data object and renders a clean, printable UI.
 */
const InvoiceTemplate = ({ data }) => {
  if (!data) return null;

  return (
    <div className="invoice-container">
      {/* HEADER */}
      <header className="invoice-header">
        <div className="invoice-header-left">
          <h1 className="invoice-title">Receipt</h1>
          <div className="invoice-meta-grid">
            <span className="meta-label">Invoice number</span>
            <span className="meta-value">{data.invoiceNumber}</span>

            <span className="meta-label">Receipt number</span>
            <span className="meta-value">{data.receiptNumber}</span>

            <span className="meta-label">Date paid</span>
            <span className="meta-value">{data.datePaid}</span>

            <span className="meta-label">Billing period</span>
            <span className="meta-value">{data.billingPeriod}</span>

            <span className="meta-label">Order ID</span>
            <span className="meta-value">{data.orderId}</span>
          </div>
        </div>
        <div className="invoice-header-right">
          <img src={logo} alt="GPS FDK Refresh" className="invoice-logo" />
        </div>
      </header>

      <hr className="invoice-divider" />

      {/* ADDRESSES */}
      <section className="invoice-addresses">
        <div className="address-block">
          <div className="address-title">{data.seller?.name}</div>
          <div className="address-content">
            {data.seller?.addressLines?.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
            {data.seller?.email && <p>{data.seller.email}</p>}
            {data.seller?.phone && <p>{data.seller.phone}</p>}
            {data.seller?.gstNumber && <p>GST: {data.seller.gstNumber}</p>}
          </div>
        </div>
        <div className="address-block">
          <div className="address-title">Bill to</div>
          <div className="address-content">
            <p style={{ fontWeight: 500, color: '#1a1a1a' }}>{data.billTo?.name}</p>
            {data.billTo?.email && <p>{data.billTo.email}</p>}
            {data.billTo?.addressLines?.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      </section>

      {/* AMOUNT PAID OVERVIEW */}
      <section className="amount-paid-overview">
        <h2 className="amount-paid-title">
          <span className="amount-paid-amount">{data.amountPaidOverview?.amount}</span>
          <span className="amount-paid-connector"> paid on </span>
          {data.amountPaidOverview?.date}
        </h2>
        {data.amountPaidOverview?.description && (
          <p className="amount-paid-subtitle">{data.amountPaidOverview.description}</p>
        )}
      </section>

      {/* PRODUCTS TABLE */}
      <section className="invoice-table-wrapper">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.products?.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td>{item.qty}</td>
                <td>{item.unitPrice}</td>
                <td>{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* TOTALS */}
      <section className="invoice-totals">
        <div className="totals-grid">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{data.subtotal}</span>
          </div>
          <div className="totals-row">
            <span>Tax (GST)</span>
            <span>{data.taxAmount}</span>
          </div>
          <div className="totals-row">
            <span>Total</span>
            <span>{data.total}</span>
          </div>
          <div className="totals-row bold">
            <span>Amount paid</span>
            <span>{data.amountPaid}</span>
          </div>
        </div>
      </section>

      {/* PAYMENT HISTORY */}
      {data.paymentHistory && data.paymentHistory.length > 0 && (
        <section className="payment-history-section">
          <h3 className="section-heading">Payment history</h3>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Payment method</th>
                <th>Date</th>
                <th>Amount paid</th>
                <th>Receipt number</th>
              </tr>
            </thead>
            <tbody>
              {data.paymentHistory.map((payment, idx) => (
                <tr key={idx}>
                  <td>{payment.method}</td>
                  <td>{payment.date}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.receiptNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* FOOTER */}
      <div className="invoice-footer">
        GPS FDK Refresh Inc. — Thank you for your purchase.
      </div>
    </div>
  );
};

export default InvoiceTemplate;
