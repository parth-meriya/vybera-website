/**
 * Calculates a product's active price, compare-at price, and discount metrics
 * based on product data and any currently active global sale campaign.
 *
 * @param {Object} product - The product document.
 * @param {Object} campaignConfig - The global campaign configuration from Firestore settings.
 * @returns {Object} { price, compareAtPrice, isCampaign, discountPercent }
 */
export const getProductPricing = (product, campaignConfig) => {
  if (!product) {
    return { price: 0, compareAtPrice: null, isCampaign: false, discountPercent: 0 };
  }

  const price = Number(product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || product.originalPrice || 0);

  // If a campaign is active
  if (campaignConfig?.active) {
    // 1. Check if product has a specific campaign price override
    if (product.campaignPrice && Number(product.campaignPrice) > 0) {
      const activePrice = Number(product.campaignPrice);
      const activeComparePrice = compareAtPrice > activePrice ? compareAtPrice : price;
      return {
        price: activePrice,
        compareAtPrice: activeComparePrice,
        isCampaign: true,
        discountPercent: activeComparePrice > 0 ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100) : 0
      };
    }
    // 2. Otherwise apply global campaign discount percentage
    if (campaignConfig.discountPercent && campaignConfig.discountPercent > 0) {
      const discount = (price * campaignConfig.discountPercent) / 100;
      const activePrice = Math.round(price - discount);
      const activeComparePrice = compareAtPrice > activePrice ? compareAtPrice : price;
      return {
        price: activePrice,
        compareAtPrice: activeComparePrice,
        isCampaign: true,
        discountPercent: activeComparePrice > 0 ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100) : 0
      };
    }
  }

  // Normal pricing (no active campaign)
  const hasDiscount = compareAtPrice > price;
  return {
    price: price,
    compareAtPrice: hasDiscount ? compareAtPrice : null,
    isCampaign: false,
    discountPercent: hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0
  };
};
