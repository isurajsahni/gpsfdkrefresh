import { motion } from 'framer-motion';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-primary text-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-10 text-secondary">Terms & Conditions</h1>
          
          <div className="prose prose-lg max-w-none text-secondary/80">
            <p className="mb-6 text-sm text-secondary/50">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="mb-6">
              By accessing our website, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.
            </p>

            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">2. Use License</h2>
            <p className="mb-6">
              Permission is granted to temporarily download one copy of the materials on GPSFDK's website for personal, non-commercial transitory viewing only.
            </p>
            
            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">3. Custom Orders</h2>
            <p className="mb-6">
              When placing a custom order, it is your responsibility to ensure all provided details (spelling, capitalization, etc.) are correct. We will craft the product exactly as specified and cannot be held liable for customer errors.
            </p>

            <h2 className="text-2xl font-heading font-bold text-secondary mt-8 mb-4">4. Revisions and Errata</h2>
            <p className="mb-6">
              The materials appearing on GPSFDK's website may include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on its website at any time without notice.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions;
