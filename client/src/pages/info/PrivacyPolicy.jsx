import { motion } from 'framer-motion';
import SEO from '../../components/seo/SEO';
import { KindHero, KindCTA, PolicySection } from '../../components/kindact/KindUI';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Privacy Policy | GPSFDK"
        description="How GPSFDK collects, uses and protects your personal data when you shop for canvas prints and custom nameplates online."
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          crumb="Home / Privacy Policy"
          title={
            <>
              Your privacy, <span className="text-kind-lime">protected.</span>
            </>
          }
          description="How Radhe Radhe GPS Private Limited collects, uses and safeguards your personal information when you shop with us."
        >
          <p className="mt-5 text-kind-sage text-sm">Last updated on March 25th 2026</p>
        </KindHero>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-3 sm:px-5 mt-8 sm:mt-12 space-y-5 sm:space-y-6"
      >
        <PolicySection title="Overview">
          <p>
            This privacy policy sets out how Radhe Radhe GPS Private Limited uses and protects any information that you give Radhe Radhe GPS Private Limited when you visit their website and/or agree to purchase from them.
          </p>
          <p>
            Radhe Radhe GPS Private Limited is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, and then you can be assured that it will only be used in accordance with this privacy statement.
          </p>
          <p>
            Radhe Radhe GPS Private Limited may change this policy from time to time by updating this page. You should check this page from time to time to ensure that you adhere to these changes.
          </p>
        </PolicySection>

        <PolicySection index={1} title="We may collect the following information:">
          <ul className="list-disc pl-5 space-y-2">
            <li>Name</li>
            <li>Contact information including email address</li>
            <li>Demographic information such as postcode, preferences and interests, if required</li>
            <li>Other information relevant to customer surveys and/or offers</li>
          </ul>
        </PolicySection>

        <PolicySection index={2} title="What we do with the information we gather">
          <p>We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Internal record keeping.</li>
            <li>We may use the information to improve our products and services.</li>
            <li>We may periodically send promotional emails about new products, special offers or other information which we think you may find interesting using the email address which you have provided.</li>
            <li>From time to time, we may also use your information to contact you for market research purposes. We may contact you by email, phone, fax or mail. We may use the information to customise the website according to your interests.</li>
          </ul>
          <p className="font-medium">We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure we have put in suitable measures.</p>
        </PolicySection>

        <PolicySection index={3} title="How we use cookies">
          <p>
            A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyze web traffic or lets you know when you visit a particular site. Cookies allow web applications to respond to you as an individual. The web application can tailor its operations to your needs, likes and dislikes by gathering and remembering information about your preferences.
          </p>
          <p>
            We use traffic log cookies to identify which pages are being used. This helps us analyze data about webpage traffic and improve our website in order to tailor it to customer needs. We only use this information for statistical analysis purposes and then the data is removed from the system.
          </p>
          <p>
            Overall, cookies help us provide you with a better website, by enabling us to monitor which pages you find useful and which you do not. A cookie in no way gives us access to your computer or any information about you, other than the data you choose to share with us.
          </p>
          <p>
            You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website.
          </p>
        </PolicySection>

        <PolicySection index={4} title="Controlling your personal information">
          <p>You may choose to restrict the collection or use of your personal information in the following ways:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>whenever you are asked to fill in a form on the website, look for the box that you can click to indicate that you do not want the information to be used by anybody for direct marketing purposes</li>
            <li>if you have previously agreed to us using your personal information for direct marketing purposes, you may change your mind at any time by writing to or emailing us</li>
          </ul>
          <p>
            We will not sell, distribute or lease your personal information to third parties unless we have your permission or are required by law to do so. We may use your personal information to send you promotional information about third parties which we think you may find interesting if you tell us that you wish this to happen.
          </p>
          <p>
            If you believe that any information we are holding on you is incorrect or incomplete, please write to <strong>GPS, Circular Rd., Near More Store, Faridkot PUNJAB 151203</strong> or contact us as soon as possible. We will promptly correct any information found to be incorrect.
          </p>
        </PolicySection>
      </motion.div>

      <KindCTA />
    </div>
  );
};

export default PrivacyPolicy;
