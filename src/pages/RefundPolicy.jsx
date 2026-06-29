import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <SEO
        title="Cancellation Policy"
        description="VYBERA's cancellation policy. We do not offer COD, returns, refunds, or exchanges. Free replacement is available only for defective or damaged items."
        path="/refund-policy"
      />
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vy-card border border-vy-border p-8 md:p-12"
        >
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white mb-8 border-b border-vy-border pb-6">
            Cancellation Policy
          </h1>

          <div className="space-y-8 text-vy-light text-sm leading-relaxed">
            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">1. No Cash on Delivery (COD)</h2>
              <p>
                VYBERA does <strong>not</strong> offer Cash on Delivery. All orders must be paid online at the time of purchase via our secure payment gateway (UPI, credit/debit cards, net banking, wallets, or reward points).
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">2. No Returns, Refunds, or Exchanges</h2>
              <p>
                All sales are <strong>final</strong>. We do not accept returns, issue refunds, or offer exchanges for any reason, including change of mind, incorrect size selection, or buyer's remorse. Please refer to our size guide carefully before placing your order.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">3. Cancellations</h2>
              <p>
                Orders can be cancelled within <strong>12 hours</strong> of placement, provided the order has not yet been dispatched. Once dispatched, cancellations are not possible. For custom-designed T-shirts, cancellations are not permitted once the printing process has begun.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">4. Defective or Damaged Items Only</h2>
              <p>
                If you receive a defective or damaged item, please contact us within <strong>48 hours</strong> of delivery with clear photographic evidence. Upon verification, we will arrange a <strong>free replacement</strong> (subject to stock availability). No monetary refunds or exchanges will be issued — only replacements of the same product.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-vy-grey">
                <li>Contact us via our Contact page or email at vybera@gmail.com with your order ID and photos.</li>
                <li>Customized products are eligible for replacement only if there is a manufacturing defect.</li>
                <li>Items bought during clearance sales follow the same defective-only exchange policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">5. Contact</h2>
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
