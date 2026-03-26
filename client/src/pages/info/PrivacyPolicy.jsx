import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-primary pt-[120px] pb-24 text-secondary">
      <div className="max-w-4xl mx-auto px-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-4 tracking-wide">Privacy Policy</h1>
          <p className="text-secondary/60 text-sm">Last updated on March 25th 2026</p>
          <div className="w-24 h-1 bg-accent mx-auto rounded-full mt-6"></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="prose prose-lg max-w-none text-secondary/80 font-body space-y-10">
          
          <p className="leading-relaxed">
            This privacy policy sets out how Radhe Radhe GPS Private Limited uses and protects any information that you give Radhe Radhe GPS Private Limited when you visit their website and/or agree to purchase from them.
          </p>
          <p className="leading-relaxed">
            Radhe Radhe GPS Private Limited is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, and then you can be assured that it will only be used in accordance with this privacy statement.
          </p>
          <p className="leading-relaxed">
            Radhe Radhe GPS Private Limited may change this policy from time to time by updating this page. You should check this page from time to time to ensure that you adhere to these changes.
          </p>

          <section>
            <h2 className="text-2xl font-heading font-bold text-secondary mb-4">We may collect the following information:</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name</li>
              <li>Contact information including email address</li>
              <li>Demographic information such as postcode, preferences and interests, if required</li>
              <li>Other information relevant to customer surveys and/or offers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-secondary mb-4">What we do with the information we gather</h2>
            <p className="mb-4">We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Internal record keeping.</li>
              <li>We may use the information to improve our products and services.</li>
              <li>We may periodically send promotional emails about new products, special offers or other information which we think you may find interesting using the email address which you have provided.</li>
              <li>From time to time, we may also use your information to contact you for market research purposes. We may contact you by email, phone, fax or mail. We may use the information to customise the website according to your interests.</li>
            </ul>
            <p className="mt-4 font-medium">We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure we have put in suitable measures.</p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-secondary mb-4">How we use cookies</h2>
            <p className="leading-relaxed mb-4">
              A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyze web traffic or lets you know when you visit a particular site. Cookies allow web applications to respond to you as an individual. The web application can tailor its operations to your needs, likes and dislikes by gathering and remembering information about your preferences.
            </p>
            <p className="leading-relaxed mb-4">
              We use traffic log cookies to identify which pages are being used. This helps us analyze data about webpage traffic and improve our website in order to tailor it to customer needs. We only use this information for statistical analysis purposes and then the data is removed from the system.
            </p>
            <p className="leading-relaxed mb-4">
              Overall, cookies help us provide you with a better website, by enabling us to monitor which pages you find useful and which you do not. A cookie in no way gives us access to your computer or any information about you, other than the data you choose to share with us.
            </p>
            <p className="leading-relaxed">
              You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-secondary mb-4">Controlling your personal information</h2>
            <p className="mb-4">You may choose to restrict the collection or use of your personal information in the following ways:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>whenever you are asked to fill in a form on the website, look for the box that you can click to indicate that you do not want the information to be used by anybody for direct marketing purposes</li>
              <li>if you have previously agreed to us using your personal information for direct marketing purposes, you may change your mind at any time by writing to or emailing us</li>
            </ul>
            <p className="leading-relaxed mb-4">
              We will not sell, distribute or lease your personal information to third parties unless we have your permission or are required by law to do so. We may use your personal information to send you promotional information about third parties which we think you may find interesting if you tell us that you wish this to happen.
            </p>
            <p className="leading-relaxed">
              If you believe that any information we are holding on you is incorrect or incomplete, please write to <strong>GPS, Circular Rd., Near More Store, Faridkot PUNJAB 151203</strong> or contact us as soon as possible. We will promptly correct any information found to be incorrect.
            </p>
          </section>

        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
