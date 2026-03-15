import { motion } from 'framer-motion';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-primary">About Us</h1>
          <p className="text-xl text-primary/70 max-w-3xl mx-auto">
            Welcome to GPSFDK. We are dedicated to bringing premium wall canvases and custom house nameplates to your home.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-primary/5 aspect-square rounded-2xl flex items-center justify-center p-8">
              <span className="text-primary/20 text-2xl font-heading">Our Story</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-heading font-bold mb-6 text-primary">Crafted with Passion</h2>
            <p className="text-primary/70 leading-relaxed text-lg">
              At GPSFDK, we believe that your living space should reflect your unique personality and style. Our journey began with a simple idea: to make luxury accessible.
            </p>
            <p className="text-primary/70 leading-relaxed text-lg">
              Every canvas and nameplate is meticulously designed and crafted using high-quality materials to ensure longevity and aesthetic appeal. We take pride in our attention to detail and commitment to customer satisfaction.
            </p>
            <div className="pt-4">
              <div className="flex items-center gap-4 text-primary">
                <div className="w-12 h-1 bg-accent rounded-full"></div>
                <p className="font-semibold">Quality First</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
