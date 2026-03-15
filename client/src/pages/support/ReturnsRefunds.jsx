import { motion } from 'framer-motion';

const ReturnsRefunds = () => {
  return (
    <div className="min-h-screen bg-primary text-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-10 text-secondary">Returns & Refunds</h1>
          
          <div className="prose prose-lg max-w-none text-secondary/80">
            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">Our Guarantee</h2>
            <p className="mb-6">
              We stand behind the quality of our products. If your item arrives damaged or defective, we will gladly send a replacement at no extra cost or provide a full refund.
            </p>
            
            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">Standard Returns</h2>
            <p className="mb-6">
              For non-customized items, we accept returns within 7 days of delivery. The item must be in its original condition and packaging. Return shipping costs are the responsibility of the customer unless the item was damaged upon arrival.
            </p>

            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">Customized Items</h2>
            <p className="mb-6">
              Because customized items (like personalized nameplates) are made specifically for you, we cannot accept returns for reasons other than damage or a mistake on our part. Please ensure all spelling and details are correct before placing a custom order.
            </p>

            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">Refund Process</h2>
            <p className="mb-6">
              Once we receive and inspect your returned item, we will process your refund to the original method of payment. Please allow 5-7 business days for the refund to reflect on your statement.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnsRefunds;
