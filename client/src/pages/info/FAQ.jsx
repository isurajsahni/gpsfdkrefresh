import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import faqImage from '../../assets/image/faq_demo.webp';
import SEO from '../../components/seo/SEO';
import { KindButton, KindHero } from '../../components/kindact/KindUI';
import heroImage from '../../assets/image/faq_demo.webp';
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE } from '../../utils/shipping';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  // Every answer here also feeds the FAQPage schema below, which answer engines
  // quote directly. Keep them in step with the policy pages and the catalogue.
  const faqs = [
    {
      question: 'What materials do you use for canvases?',
      answer: 'Our canvases are printed on 350 GSM canvas with eco-solvent inks, which are environment-friendly and long-lasting. You can order a canvas rolled, or stretched over a wooden frame and ready to hang.'
    },
    {
      question: 'What sizes are available?',
      answer: 'Canvases come in sizes from 12x18 to 36x60 inches (square designs from 12x12 to 48x48 inches), rolled or stretched. Posters come in A4 and A3, as a sticker or on soft board. Each product page lists its exact sizes and prices.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping usually takes 5-7 business days within India. Custom nameplates might require an additional 2-3 days for crafting.'
    },
    {
      question: 'Is shipping free?',
      answer: `Within India, shipping is free on orders of ₹${FREE_SHIPPING_THRESHOLD} or more. Orders below that carry a flat ₹${FLAT_SHIPPING_FEE} shipping fee.`
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we deliver worldwide. Just enter your address at checkout: prices are shown in your local currency, and every order comes with a tracking link. Cash on Delivery is only available within India.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'UPI, credit and debit cards and net banking, all through Razorpay’s secure checkout. Cash on Delivery is also available on orders within India.'
    },
    {
      question: 'How can I track my order?',
      answer: 'Once your order is dispatched, you’ll get a tracking link by email or SMS. You can also check its status on our Track Order page with your order ID and email or phone number.'
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
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Frequently Asked Questions | GPSFDK Support"
        description="Find answers to common questions about our premium canvases, custom nameplates, shipping, and returns."
        schema={faqSchema}
      />

      {/* ─── Hero ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          image={heroImage}
          crumb="Home / FAQs"
          title={
            <>
              Your questions, <span className="text-kind-lime">answered.</span>
            </>
          }
          description="Find answers to common questions about our products and services."
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 mt-6 sm:mt-8">
        <div className="flex flex-col md:flex-row gap-5 sm:gap-6 lg:gap-10 items-stretch">

          {/* Left Side Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-5/12"
          >
            <div className="relative rounded-[24px] overflow-hidden h-full min-h-[250px] sm:min-h-[300px] md:min-h-[500px] group border border-kind-forest/10">
              <div className="absolute inset-0 bg-kind-forest/20 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-multiply"></div>
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
                  className="bg-kind-mist rounded-[20px] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex justify-between items-center gap-4 p-5 md:p-6 text-left focus:outline-none"
                  >
                    <h3 className="apple-body font-heading font-semibold text-kind-ink pr-2">
                      {faq.question}
                    </h3>
                    <span
                      className={`w-9 h-9 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                    >
                      <FaChevronDown size={13} />
                    </span>
                  </button>

                  <div
                    className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 pb-5 md:pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="apple-body text-kind-ink/70">{faq.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Still have questions? — forest strip */}
            <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest text-white mt-8 md:mt-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-kind-lime/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-kind-mint/10 blur-3xl" />
              </div>
              <div className="relative">
                <h4 className="apple-tile-title font-heading mb-1">Still have questions?</h4>
                <p className="apple-body text-kind-sage">Our support team is ready to help.</p>
              </div>
              <div className="relative shrink-0">
                <KindButton to="/contact" variant="lime">
                  Contact Us
                </KindButton>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default FAQ;
