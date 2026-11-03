import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-[#F3E7D8] pt-24 pb-16">
      <SEO
        title="Cancellation Policy"
        description="VYBERA's cancellation policy. All sales are final. We do not offer COD, returns, refunds, exchanges, or replacements."
        path="/refund-policy"
      />
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-8 md:p-12 shadow-sm"
        >
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-[#30231F] mb-8 border-b border-[#D4BEA5] pb-6">
            Cancellation Policy
          </h1>

          <div className="space-y-8 text-[#30231F] text-sm leading-relaxed">
            <section>
              <h2 className="text-[#30231F] font-bold text-lg mb-3">1. No Cash on Delivery (COD)</h2>
              <p>
                VYBERA does <strong>not</strong> offer Cash on Delivery. All orders must be paid online at the time of purchase via our secure payment gateway (UPI, credit/debit cards, net banking, wallets, or reward points).
              </p>
            </section>

            <section>
              <h2 className="text-[#30231F] font-bold text-lg mb-3">2. All Sales Are Final</h2>
              <p>
                All sales are <strong>final</strong>. We do not accept returns, issue refunds, offer exchanges, or provide replacements for any reason whatsoever. This includes but is not limited to change of mind, incorrect size selection, colour mismatch on screen vs. actual product, or buyer's remorse.
              </p>
              <p className="mt-3">
                Please review our size guide, product images, and descriptions carefully before placing your order.
              </p>
            </section>

            <section>
              <h2 className="text-[#30231F] font-bold text-lg mb-3">3. Cancellations</h2>
              <p>
                Orders can be cancelled within <strong>12 hours</strong> of placement, provided the order has not yet been dispatched. Once dispatched, cancellations are not possible. For custom-designed T-shirts, cancellations are not permitted once the printing process has begun.
              </p>
            </section>

            <section>
              <h2 className="text-[#30231F] font-bold text-lg mb-3">4. Quality Assurance</h2>
              <p>
                We take product quality very seriously. Every item undergoes a quality check before dispatch. By purchasing from VYBERA, you acknowledge and agree that all sales are final and no post-delivery claims will be entertained.
              </p>
            </section>

            <section>
              <h2 className="text-[#30231F] font-bold text-lg mb-3">5. Contact</h2>
              <p>
                For any questions regarding this policy, please reach out to us at <strong>vybera@gmail.com</strong>. We typically respond within 24–48 hours.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicy;
