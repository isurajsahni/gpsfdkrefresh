import { motion } from 'framer-motion';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-primary pt-[100px] sm:pt-[120px] pb-16 sm:pb-24 text-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-8 sm:mb-10 text-secondary leading-tight">Terms & Conditions</h1>
          
          <div className="prose prose-base sm:prose-lg max-w-none text-secondary/80">
            <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-secondary/50">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-secondary mt-6 sm:mt-8 mb-3 sm:mb-4">1. Agreement to Terms</h2>
            <p className="mb-5 sm:mb-6 text-sm sm:text-base leading-relaxed">
              By accessing our website, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.
            </p>

            <h2 className="text-xl sm:text-2xl font-heading font-bold text-secondary mt-6 sm:mt-8 mb-3 sm:mb-4">2. Use License</h2>
            <p className="mb-5 sm:mb-6 text-sm sm:text-base leading-relaxed">
              Permission is granted to temporarily download one copy of the materials on GPSFDK's website for personal, non-commercial transitory viewing only.
            </p>
            
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-secondary mt-6 sm:mt-8 mb-3 sm:mb-4">3. Custom Orders</h2>
            <p className="mb-5 sm:mb-6 text-sm sm:text-base leading-relaxed">
              When placing a custom order, it is your responsibility to ensure all provided details (spelling, capitalization, etc.) are correct. We will craft the product exactly as specified and cannot be held liable for customer errors.
            </p>

            <h2 className="text-xl sm:text-2xl font-heading font-bold text-secondary mt-6 sm:mt-8 mb-3 sm:mb-4">4. Revisions and Errata</h2>
            <p className="mb-5 sm:mb-6 text-sm sm:text-base leading-relaxed">
              The materials appearing on GPSFDK's website may include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on its website at any time without notice.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions;
