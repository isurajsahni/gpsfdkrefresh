import { motion } from 'framer-motion';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-primary text-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-10 text-secondary">Shipping Policy</h1>
          
          <div className="prose prose-lg max-w-none text-secondary/80">
            <p className="mb-6">
              At GPSFDK, we aim to deliver your premium canvases and nameplates safely and promptly. Here are the details of our shipping process:
            </p>
            
            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">Processing Time</h2>
            <p className="mb-6">
              All non-customized orders are typically processed and handed over to our shipping partners within 1-2 business days. Customized items, such as house nameplates, require meticulous crafting and generally take 3-5 business days to process before shipment.
            </p>
            
            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">Shipping Times & Costs</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Standard Shipping:</strong> Usually takes 5-7 business days across India. Cost varies by location and weight, calculated at checkout.</li>
              <li><strong>Free Shipping:</strong> Often available on orders over a certain threshold (e.g., ₹2000). Check the banner on our homepage for current promotions.</li>
            </ul>

            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">Tracking Your Order</h2>
            <p className="mb-6">
              Once your order has been dispatched, you will receive a tracking link via email or SMS, allowing you to follow your package's journey to your doorstep.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
