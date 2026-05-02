import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <SEO
        title="Privacy Policy"
        description="Learn how VYBERA collects, uses, and protects your personal data. We are committed to ensuring your privacy is protected."
        path="/privacy-policy"
      />
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vy-card border border-vy-border p-8 md:p-12"
        >
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white mb-8 border-b border-vy-border pb-6">
            Privacy Policy
          </h1>

          <div className="space-y-8 text-vy-light text-sm leading-relaxed">
            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">1. Information We Collect</h2>
              <p>
                We may collect the following information when you use the VYBERA website: name, contact information including email address and phone number, demographic information such as postcode, preferences, and interests, and other information relevant to customer surveys and/or offers.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">2. What We Do With The Information</h2>
              <p>
                We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-vy-grey">
                <li>Internal record keeping and order fulfillment.</li>
                <li>We may use the information to improve our products and services.</li>
                <li>We may periodically send promotional emails about new drops, special offers, or other information which we think you may find interesting.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">3. Security</h2>
              <p>
                We are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we have put in place suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online. Your payment details are processed securely through our payment gateway partner (Razorpay) and are not stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">4. How We Use Cookies</h2>
              <p>
                A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyze web traffic or lets you know when you visit a particular site. We use traffic log cookies to identify which pages are being used. This helps us analyze data about web page traffic and improve our website in order to tailor it to customer needs.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">5. Controlling Your Personal Information</h2>
              <p>
                We will not sell, distribute, or lease your personal information to third parties unless we have your permission or are required by law to do so. If you believe that any information we are holding on you is incorrect or incomplete, please write to or email us as soon as possible at vybera@gmail.com. We will promptly correct any information found to be incorrect.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
