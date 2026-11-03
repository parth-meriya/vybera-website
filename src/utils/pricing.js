/**
 * VYBERA — Product Pricing & Sale Calculation Engine
 *
 * Ensures:
 * - Accurate discount percentages
 * - Server & client price consistency
 * - Prevention of negative prices
 * - Prevention of double discounting
 */

/**
 * Checks if a product's sale status is active based on showInSale flag and schedule dates.
 *
 * @param {Object} product - Product document
 * @returns {boolean}
 */
export const isProductSaleActive = (product) => {
  if (!product) return false;

  // Must have showInSale enabled and a valid sale price
  const hasSaleFlag = product.showInSale === true || (product.showInSale === undefined && Boolean(product.salePrice));
  const salePrice = Number(product.salePrice || 0);
  const regularPrice = Number(product.price || 0);

  if (!hasSaleFlag || salePrice <= 0 || (regularPrice > 0 && salePrice >= regularPrice)) {
    return false;
  }

  const now = Date.now();

  if (product.saleStartAt) {
    const start = new Date(product.saleStartAt).getTime();
    if (!isNaN(start) && now < start) return false;
  }

  if (product.saleEndAt) {
    const end = new Date(product.saleEndAt).getTime();
    if (!isNaN(end) && now > end) return false;
  }

  return true;
};

/**
 * Checks if a product's New Drop status is active based on showInNewDrops and schedule dates.
 *
 * @param {Object} product - Product document
 * @returns {boolean}
 */
export const isProductNewDropActive = (product) => {
  if (!product) return false;
  const isDrop = product.showInNewDrops === true || (product.showInNewDrops === undefined && Boolean(product.isDrop));
  if (!isDrop) return false;

  const now = Date.now();

  if (product.newDropStartAt) {
    const start = new Date(product.newDropStartAt).getTime();
    if (!isNaN(start) && now < start) return false;
  }

  if (product.newDropEndAt) {
    const end = new Date(product.newDropEndAt).getTime();
    if (!isNaN(end) && now > end) return false;
  }

  return true;
};

/**
 * Calculates a product's active price, compare-at price, and discount metrics.
 *
 * @param {Object} product - The product document.
 * @param {Object} campaignConfig - The global campaign configuration from Firestore settings.
 * @returns {Object} { price, compareAtPrice, isSale, isCampaign, discountPercent }
 */
export const getProductPricing = (product, campaignConfig = null) => {
  if (!product) {
    return { price: 0, compareAtPrice: null, isSale: false, isCampaign: false, discountPercent: 0 };
  }

  const regularPrice = Math.max(0, Number(product.price || 0));
  const compareAtPrice = Number(product.compareAtPrice || product.originalPrice || 0);

  // 1. Dedicated Admin Sale Pricing (Top Priority)
  if (isProductSaleActive(product)) {
    const salePrice = Math.max(0, Number(product.salePrice));
    const activeComparePrice = compareAtPrice > regularPrice ? compareAtPrice : regularPrice;
    const discountPercent = activeComparePrice > salePrice && activeComparePrice > 0
      ? Math.round(((activeComparePrice - salePrice) / activeComparePrice) * 100)
      : 0;

    return {
      price: salePrice,
      compareAtPrice: activeComparePrice,
      isSale: true,
      isCampaign: false,
      discountPercent: Math.max(0, discountPercent),
    };
  }

  // 2. Global Campaign Discount (e.g. Diwali campaign)
  if (campaignConfig?.active || campaignConfig?.enabled) {
    // Campaign specific price override
    if (product.campaignPrice && Number(product.campaignPrice) > 0) {
      const activePrice = Math.max(0, Number(product.campaignPrice));
      const activeComparePrice = compareAtPrice > activePrice ? compareAtPrice : regularPrice;
      return {
        price: activePrice,
        compareAtPrice: activeComparePrice,
        isSale: true,
        isCampaign: true,
        discountPercent: activeComparePrice > 0 ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100) : 0,
      };
    }

    // Global campaign discount percentage
    if (campaignConfig.discountPercent && campaignConfig.discountPercent > 0) {
      const discount = (regularPrice * campaignConfig.discountPercent) / 100;
      const activePrice = Math.max(0, Math.round(regularPrice - discount));
      const activeComparePrice = compareAtPrice > activePrice ? compareAtPrice : regularPrice;
      return {
        price: activePrice,
        compareAtPrice: activeComparePrice,
        isSale: true,
        isCampaign: true,
        discountPercent: activeComparePrice > 0 ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100) : 0,
      };
    }
  }

  // 3. Normal Standard Pricing (with optional compareAtPrice markdown)
  const hasDiscount = compareAtPrice > regularPrice;
  return {
    price: regularPrice,
    compareAtPrice: hasDiscount ? compareAtPrice : null,
    isSale: false,
    isCampaign: false,
    discountPercent: hasDiscount ? Math.round(((compareAtPrice - regularPrice) / compareAtPrice) * 100) : 0,
  };
};
