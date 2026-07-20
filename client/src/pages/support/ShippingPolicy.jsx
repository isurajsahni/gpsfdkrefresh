import { motion } from 'framer-motion';
import shippingImage from '../../assets/image/shipping_demo.webp';
import SEO from '../../components/seo/SEO';
import { KindHero, KindCTA, PolicySection } from '../../components/kindact/KindUI';
import heroImage from '../../assets/image/shipping_demo.webp';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Shipping Policy | GPSFDK Canvas & Nameplate Delivery India"
        description="GPSFDK shipping policy — delivery timelines, charges and order tracking for premium canvas prints and custom nameplates across India and worldwide."
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          image={heroImage}
          crumb="Home / Shipping Policy"
          title={
            <>
              Delivered safely, <span className="text-kind-lime">right on time.</span>
            </>
          }
          description="Fast, secure, and reliable delivery for your premium orders."
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-3 sm:px-5 mt-8 sm:mt-12 space-y-5 sm:space-y-6"
      >
        <div className="rounded-[24px] overflow-hidden border border-kind-forest/10">
          <img src={shippingImage} alt="Premium Package Shipping" className="w-full h-56 sm:h-72 object-cover" />
        </div>

        <div className="bg-kind-mist rounded-[20px] p-6 sm:p-8">
          <p className="text-sm sm:text-base text-kind-ink/80 leading-relaxed">
            At GPSFDK, we aim to deliver your premium canvases and nameplates safely and promptly.
          </p>
        </div>

        <PolicySection index={1} title="Processing Time">
          <p>
            All non-customized orders are typically processed and handed over to our shipping partners within <strong>1-2 business days</strong>. Customized items, such as house nameplates, require meticulous crafting and generally take <strong>3-5 business days</strong> to process before shipment.
          </p>
        </PolicySection>

        <PolicySection index={2} title="Shipping Times & Costs">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Standard Shipping:</strong> Usually takes 5-7 business days across India. Cost varies by location and weight, calculated at checkout.
            </li>
            <li>
              <strong>Free Shipping:</strong> Often available on orders over a certain threshold (e.g., ₹2000). Check the banner on our homepage for current promotions.
            </li>
          </ul>
        </PolicySection>

        <PolicySection index={3} title="Tracking Your Order">
          <p>
            Once your order has been dispatched, you will receive a tracking link via email or SMS, allowing you to follow your package's journey to your doorstep.
          </p>
        </PolicySection>
      </motion.div>

      <KindCTA />
    </div>
  );
};

export default ShippingPolicy;
