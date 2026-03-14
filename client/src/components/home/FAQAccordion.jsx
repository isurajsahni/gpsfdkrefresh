import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown } from 'react-icons/hi';

const faqData = [
  { q: 'How long does shipping take?', a: 'We typically deliver within 5-7 business days across India. Express delivery is available for select PIN codes within 2-3 days.' },
  { q: 'What is your return policy?', a: 'We offer a 7-day return policy for damaged or defective products. Custom-made nameplates are non-returnable as they are made to order.' },
  { q: 'Can I customize my nameplate?', a: 'Absolutely! All our house nameplates are fully customizable. You can choose the color, size, and enter your family name during checkout.' },
  { q: 'What payment methods do you accept?', a: 'We accept Razorpay (UPI, Cards, Net Banking), Stripe (International Cards), and Cash on Delivery for orders within India.' },
  { q: 'Are the canvases framed?', a: 'We offer multiple options: Poster (paper/sticker/soft board), Rolled Canvas, and Stretched Canvas (gallery-wrapped on wooden frame). Choose your preference on the product page.' },
  { q: 'Do you ship internationally?', a: 'Currently we ship across India. International shipping will be available soon. Subscribe to our newsletter for updates!' },
];

const FAQAccordion = () => {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="section-padding section-spacing bg-primary">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-accent font-body text-sm tracking-[0.3em] uppercase">Support</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary mt-3">Frequently Asked Questions</h2>
          <div className="w-20 h-1 bg-accent mt-4 rounded-full mx-auto" />
        </motion.div>

        <div className="space-y-3">
          {faqData.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left"
              >
                <span className="font-semibold text-secondary pr-4">{faq.q}</span>
                <HiChevronDown className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 md:px-6 pb-5 text-gray-600 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
