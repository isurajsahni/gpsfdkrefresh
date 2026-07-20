import { motion } from 'framer-motion';
import SEO from '../../components/seo/SEO';
import { KindHero, KindCTA, PolicySection } from '../../components/kindact/KindUI';

const ReturnsRefunds = () => {
  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Returns & Refunds Policy | GPSFDK India"
        description="How returns, replacements and refunds work for canvas prints and custom house nameplates at GPSFDK. Read our hassle-free policy."
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          crumb="Home / Returns & Refunds"
          title={
            <>
              Returns made <span className="text-kind-lime">simple.</span>
            </>
          }
          description="How returns, replacements and refunds work for canvas prints and custom house nameplates at GPSFDK."
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-3 sm:px-5 mt-8 sm:mt-12 space-y-5 sm:space-y-6"
      >
        <PolicySection index={1} title="Our Guarantee">
          <p>
            We stand behind the quality of our products. If your item arrives damaged or defective, we will gladly send a replacement at no extra cost or provide a full refund.
          </p>
        </PolicySection>

        <PolicySection index={2} title="Standard Returns">
          <p>
            For non-customized items, we accept returns within 7 days of delivery. The item must be in its original condition and packaging. Return shipping costs are the responsibility of the customer unless the item was damaged upon arrival.
          </p>
        </PolicySection>

        <PolicySection index={3} title="Customized Items">
          <p>
            Because customized items (like personalized nameplates) are made specifically for you, we cannot accept returns for reasons other than damage or a mistake on our part. Please ensure all spelling and details are correct before placing a custom order.
          </p>
        </PolicySection>

        <PolicySection index={4} title="Refund Process">
          <p>
            Once we receive and inspect your returned item, we will process your refund to the original method of payment. Please allow 5-7 business days for the refund to reflect on your statement.
          </p>
        </PolicySection>
      </motion.div>

      <KindCTA title="Shop with confidence" />
    </div>
  );
};

export default ReturnsRefunds;
