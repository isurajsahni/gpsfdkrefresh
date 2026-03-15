import { motion } from 'framer-motion';

const FAQ = () => {
  const faqs = [
    {
      question: 'What materials do you use for canvases?',
      answer: 'We use high-quality, fade-resistant canvas material stretched over durable wooden frames to ensure your art lasts for years.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping usually takes 5-7 business days within India. Custom nameplates might require an additional 2-3 days for crafting.'
    },
    {
      question: 'Can I customize my house nameplate?',
      answer: 'Absolutely! Many of our nameplates offer customization options for text, font, and sometimes even color. Check the product page for specific details.'
    },
    {
      question: 'Do you offer returns?',
      answer: 'If your product arrives damaged or if there is a mistake with customization on our end, we offer a free replacement or full refund. Regular returns are accepted within 7 days of delivery.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-primary">Frequently Asked Questions</h1>
          <p className="text-xl text-primary/70">
            Find answers to common questions about our products and services.
          </p>
        </motion.div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-primary/5 rounded-2xl p-6"
            >
              <h3 className="text-xl font-heading font-bold text-primary mb-3">{faq.question}</h3>
              <p className="text-primary/70 leading-relaxed">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
