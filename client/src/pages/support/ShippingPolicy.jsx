import { motion } from 'framer-motion';
import shippingImage from '../../assets/image/shipping_demo.png';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-primary text-secondary overflow-hidden pt-[100px] sm:pt-[120px] pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-4 sm:mb-6 text-secondary tracking-wide leading-tight">Shipping Policy</h1>
          <div className="w-24 sm:w-32 h-1 sm:h-1.5 bg-accent mx-auto rounded-full shadow-lg shadow-accent/20"></div>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-secondary/70 font-body max-w-2xl mx-auto px-2 sm:px-0">
             Fast, secure, and reliable delivery for your premium orders.
          </p>
        </motion.div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-10 md:gap-12 lg:gap-20">
          
          {/* Left Side Image */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2"
          >
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group border border-secondary/10">
              <div className="absolute inset-0 bg-accent/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src={shippingImage} alt="Premium Package Shipping" className="w-full h-56 sm:h-80 md:h-[600px] object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>

          {/* Right Side Text */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full md:w-1/2 prose prose-base sm:prose-lg prose-invert max-w-none font-body"
          >
            <p className="text-base sm:text-lg md:text-xl text-secondary/80 leading-relaxed mb-6 sm:mb-8 border-l-4 border-accent pl-4 sm:pl-6 py-2 bg-secondary/5 rounded-r-xl">
              At GPSFDK, we aim to deliver your premium canvases and nameplates safely and promptly.
            </p>
            
            <div className="space-y-6 md:space-y-10 text-secondary/80">
              <section className="bg-primary/50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-secondary/10 hover:border-accent/30 transition-colors">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-accent mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs sm:text-sm text-accent shrink-0">1</span>
                  Processing Time
                </h2>
                <p className="leading-relaxed text-sm sm:text-base text-secondary/70">
                  All non-customized orders are typically processed and handed over to our shipping partners within <strong>1-2 business days</strong>. Customized items, such as house nameplates, require meticulous crafting and generally take <strong>3-5 business days</strong> to process before shipment.
                </p>
              </section>

              <section className="bg-primary/50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-secondary/10 hover:border-accent/30 transition-colors">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-accent mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs sm:text-sm text-accent shrink-0">2</span>
                  Shipping Times & Costs
                </h2>
                <ul className="space-y-4 text-sm sm:text-base text-secondary/70 list-none p-0 m-0">
                  <li className="flex flex-col sm:flex-row gap-1 sm:gap-4 pb-4 border-b border-secondary/5">
                     <strong className="text-secondary sm:min-w-[140px]">Standard Shipping:</strong> 
                     <span>Usually takes 5-7 business days across India. Cost varies by location and weight, calculated at checkout.</span>
                  </li>
                  <li className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                     <strong className="text-secondary sm:min-w-[140px]">Free Shipping:</strong> 
                     <span>Often available on orders over a certain threshold (e.g., ₹2000). Check the banner on our homepage for current promotions.</span>
                  </li>
                </ul>
              </section>

              <section className="bg-primary/50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-secondary/10 hover:border-accent/30 transition-colors">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-accent mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs sm:text-sm text-accent shrink-0">3</span>
                  Tracking Your Order
                </h2>
                <p className="leading-relaxed text-sm sm:text-base text-secondary/70">
                  Once your order has been dispatched, you will receive a tracking link via email or SMS, allowing you to follow your package's journey to your doorstep.
                </p>
              </section>
            </div>
            
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default ShippingPolicy;
