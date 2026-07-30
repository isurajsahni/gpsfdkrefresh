import { motion } from 'framer-motion';
import SEO from '../../components/seo/SEO';
import { KindHero, KindCTA, PolicySection } from '../../components/kindact/KindUI';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Terms & Conditions | GPSFDK"
        description="Terms and conditions for shopping premium canvas prints and custom house nameplates at GPSFDK India."
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          crumb="Home / Terms & Conditions"
          title={
            <>
              The fine print, <span className="text-kind-lime">made clear.</span>
            </>
          }
          description="Terms and conditions for shopping premium canvas prints and custom house nameplates at GPSFDK."
        >
          <p className="apple-caption mt-5 text-kind-sage">Last updated: {new Date().toLocaleDateString()}</p>
        </KindHero>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-3 sm:px-5 mt-8 sm:mt-12 space-y-5 sm:space-y-6"
      >
        <PolicySection index={1} title="Agreement to Terms">
          <p>
            By accessing our website, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.
          </p>
        </PolicySection>

        <PolicySection index={2} title="Use License">
          <p>
            Permission is granted to temporarily download one copy of the materials on GPSFDK's website for personal, non-commercial transitory viewing only.
          </p>
        </PolicySection>

        <PolicySection index={3} title="Custom Orders">
          <p>
            When placing a custom order, it is your responsibility to ensure all provided details (spelling, capitalization, etc.) are correct. We will craft the product exactly as specified and cannot be held liable for customer errors.
          </p>
        </PolicySection>

        <PolicySection index={4} title="Revisions and Errata">
          <p>
            The materials appearing on GPSFDK's website may include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on its website at any time without notice.
          </p>
        </PolicySection>
      </motion.div>

      <KindCTA />
    </div>
  );
};

export default TermsConditions;
