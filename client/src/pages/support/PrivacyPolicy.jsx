import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white text-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-10 text-primary">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none text-primary/80">
            <p className="mb-6 text-sm text-primary/50">Last updated: {new Date().toLocaleDateString()}</p>
            
            <p className="mb-6">
              Your privacy is important to us. It is GPSFDK's policy to respect your privacy regarding any information we may collect from you across our website.
            </p>
            
            <h2 className="text-2xl font-heading font-bold text-primary mt-8 mb-4">Information We Collect</h2>
            <p className="mb-6">
              We only ask for personal information when we truly need it to provide a service to you. For example, your name, shipping address, and email are required to process and deliver your orders. We collect it by fair and lawful means, with your knowledge and consent.
            </p>

            <h2 className="text-2xl font-heading font-bold text-primary mt-8 mb-4">How We Use Your Information</h2>
            <p className="mb-6">
              The information we collect is used solely for the purpose of fulfilling your orders, providing customer support, and, if you opt-in, sending you newsletters and promotional offers. We do not share any personally identifying information publicly or with third-parties, except when required to by law.
            </p>
            
            <h2 className="text-2xl font-heading font-bold text-primary mt-8 mb-4">Security</h2>
            <p className="mb-6">
              What data we store, we'll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification. However, no method of transmission over the internet or electronic storage is 100% secure.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
