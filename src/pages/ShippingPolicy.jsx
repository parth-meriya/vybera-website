import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-vy-black pt-24 pb-16">
      <SEO
        title="Shipping & Delivery Policy"
        description="Learn about VYBERA's shipping times, delivery partners, and dispatch processes across India."
        path="/shipping-policy"
      />
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vy-card border border-vy-border p-8 md:p-12"
        >
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-wider text-vy-white mb-8 border-b border-vy-border pb-6">
            Shipping & Delivery Policy
          </h1>

          <div className="space-y-8 text-vy-light text-sm leading-relaxed">
            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">1. Processing Time</h2>
              <p>
                All standard orders are processed and dispatched within <strong>1-3 business days</strong>. Custom-designed orders (e.g., personalized printing) require additional production time and are typically dispatched within <strong>3-5 business days</strong>. Orders are not shipped or delivered on Sundays or public holidays.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">2. Delivery Time</h2>
              <p>
                Once dispatched, the estimated delivery time depends on your location within India:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-vy-grey">
                <li><strong>Metro Cities:</strong> 2-4 business days</li>
                <li><strong>Rest of India:</strong> 4-7 business days</li>
                <li><strong>Remote Areas:</strong> 7-10 business days</li>
              </ul>
              <p className="mt-2 text-vy-grey text-xs">
                * Please note that delivery delays can occasionally occur due to unforeseen logistical challenges or bad weather.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">3. Shipping Rates</h2>
              <p>
                We currently offer <strong>Free Standard Shipping</strong> on all prepaid orders across India. For Cash on Delivery (COD) orders, a nominal convenience fee may apply, which will be calculated and displayed at checkout.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">4. Shipment Confirmation & Order Tracking</h2>
              <p>
                You will receive a Shipment Confirmation email/SMS once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours. You can also track your order status directly from our Track Order page.
              </p>
            </section>

            <section>
              <h2 className="text-vy-white font-semibold text-lg mb-3">5. Damages & Lost Packages</h2>
              <p>
                VYBERA is not liable for any products damaged or lost during shipping. However, if you received your order damaged, please contact us within 48 hours of delivery with proof (photos/videos), and we will file a claim with the shipment carrier and arrange a replacement for you.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
