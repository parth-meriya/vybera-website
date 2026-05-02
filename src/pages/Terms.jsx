import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const Terms = () => {
  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <SEO
        title="Terms & Conditions"
        description="Read the Terms and Conditions for using the VYBERA platform. These terms govern your use of our website and services."
        path="/terms"
      />
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vy-card border border-vy-border p-8 md:p-12"
        >
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white mb-8 border-b border-vy-border pb-6">
            Terms & Conditions
          </h1>

          <div className="space-y-8 text-vy-light text-sm leading-relaxed">
            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">1. Introduction</h2>
              <p>
                Welcome to VYBERA. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern VYBERA's relationship with you in relation to this website.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">2. Use of the Website</h2>
              <ul className="list-disc pl-5 space-y-2 text-vy-grey">
                <li>The content of the pages of this website is for your general information and use only. It is subject to change without notice.</li>
                <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness, or suitability of the information and materials found or offered on this website for any particular purpose.</li>
                <li>Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services, or information available through this website meet your specific requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">3. Copyright & Intellectual Property</h2>
              <p>
                This website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance, and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions. All trademarks reproduced in this website, which are not the property of, or licensed to the operator, are acknowledged on the website.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">4. Pricing & Payments</h2>
              <p>
                Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the Service. Payments are processed securely via Razorpay. We do not store your credit card details.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">5. Governing Law</h2>
              <p>
                Your use of this website and any dispute arising out of such use of the website is subject to the laws of India. Any legal disputes shall be subject to the exclusive jurisdiction of the courts located in Gujarat, India.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
