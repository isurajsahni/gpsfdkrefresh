import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import faqImage from '../../assets/image/faq_demo.png';
import SEO from '../../components/seo/SEO';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-primary text-secondary overflow-hidden pt-[120px] pb-24">
      <SEO 
        title="Frequently Asked Questions | GPSFDK Support"
        description="Find answers to common questions about our premium wall canvases, custom nameplates, shipping, and returns."
        schema={faqSchema}
      />
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-secondary tracking-wide">Frequently Asked Questions</h1>
          <div className="w-32 h-1.5 bg-accent mx-auto rounded-full shadow-lg shadow-accent/20"></div>
          <p className="mt-6 text-lg md:text-xl text-secondary/70 font-body max-w-2xl mx-auto">
             Find answers to common questions about our products and services.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-10 md:gap-12 lg:gap-20 items-stretch">
          
          {/* Left Side Image */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-5/12"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-full min-h-[250px] sm:min-h-[300px] md:min-h-[500px] group border border-secondary/10">
              <div className="absolute inset-0 bg-accent/20 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-multiply"></div>
              <img src={faqImage} alt="Customer Support" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>

          {/* Right Side FAQ Accordion */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full md:w-7/12 flex flex-col justify-center"
          >
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`bg-primary/50 border ${openIndex === index ? 'border-accent' : 'border-secondary/10'} rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/50`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex justify-between items-center p-5 md:p-6 text-left focus:outline-none"
                  >
                    <h3 className={`text-lg md:text-xl font-heading font-bold ${openIndex === index ? 'text-accent' : 'text-secondary'} transition-colors pr-4`}>
                      {faq.question}
                    </h3>
                    <div className={`p-2 rounded-full flex-shrink-0 bg-secondary/5 text-secondary/70 transition-transform duration-300 ${openIndex === index ? 'rotate-180 bg-accent/10 text-accent' : ''}`}>
                      <FaChevronDown size={14} className="md:w-4 md:h-4" />
                    </div>
                  </button>
                  
                  <div 
                    className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-5 md:pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-secondary/70 leading-relaxed text-sm md:text-base">{faq.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 md:mt-10 p-5 md:p-6 bg-accent/10 border border-accent/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-secondary mb-1">Still have questions?</h4>
                <p className="text-sm text-secondary/70">Our support team is ready to help.</p>
              </div>
              <a href="/contact" className="px-6 py-2 bg-accent text-primary font-bold rounded-lg hover:bg-accent-dark transition-colors whitespace-nowrap">
                Contact Us
              </a>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
};

export default FAQ;
