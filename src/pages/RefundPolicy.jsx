import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <SEO
        title="Refund & Cancellation Policy"
        description="Learn about VYBERA's return, refund, and cancellation policies. See how we handle defective items and exchange requests."
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
            Refund & Cancellation Policy
          </h1>

          <div className="space-y-8 text-vy-light text-sm leading-relaxed">
            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">1. Cancellations</h2>
              <p>
                Orders can be cancelled within <strong>24 hours</strong> of placement, provided the order has not yet been dispatched. If the order is dispatched, it cannot be cancelled. For custom-designed T-shirts, cancellations are not permitted once the printing process has begun.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">2. Returns & Exchanges</h2>
              <p>
                We offer a <strong>7-day return and exchange policy</strong> from the date of delivery. To be eligible for a return or exchange, your item must be unused, unwashed, and in the same condition that you received it, with all original tags and packaging intact.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-vy-grey">
                <li>Return requests must be initiated via our Contact page or email at vybera@gmail.com.</li>
                <li>Customized products cannot be returned or exchanged unless there is a manufacturing defect.</li>
                <li>Items bought during clearance sales are non-returnable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">3. Defective or Damaged Items</h2>
              <p>
                If you receive a defective or damaged item, please contact us immediately (within 48 hours of delivery) with photographic evidence. We will arrange a reverse pickup and issue a free replacement or a full refund depending on your preference and stock availability.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">4. Refunds</h2>
              <p>
                Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. If approved, your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within <strong>5-7 business days</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">5. Late or Missing Refunds</h2>
              <p>
                If you haven't received a refund yet, first check your bank account again. Then contact your credit card company, as it may take some time before your refund is officially posted. Next, contact your bank. If you've done all of this and you still have not received your refund, please contact us at vybera@gmail.com.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicy;
