import { motion } from 'framer-motion';
import { HiOutlineFlag, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineLockClosed } from 'react-icons/hi';

const features = [
  { icon: HiOutlineFlag, title: 'Proudly Made in India', desc: 'Handcrafted with love and precision' },
  { icon: HiOutlineTruck, title: 'Free Fast Shipping', desc: 'Free delivery across India' },
  { icon: HiOutlineShieldCheck, title: '11,000+ Safe Deliveries', desc: 'Trusted by thousands of customers' },
  { icon: HiOutlineLockClosed, title: 'Secure Payments', desc: 'Razorpay, Stripe & COD accepted' },
];

const FeaturesSection = () => {
  return (
    <section className="section-padding py-16 bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group text-center p-8 rounded-2xl bg-white hover:bg-secondary transition-all duration-500 hover:shadow-xl cursor-default"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 group-hover:bg-accent flex items-center justify-center transition-all duration-500">
                <feature.icon className="w-8 h-8 text-accent group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-secondary group-hover:text-white transition-colors duration-500">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-500 text-sm group-hover:text-white/70 transition-colors duration-500">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
