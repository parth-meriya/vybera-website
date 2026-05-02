import { createContext, useContext, useEffect, useState } from 'react';
import { getActiveSale } from '../firebase/sales';

const SaleContext = createContext(null);

export const SaleProvider = ({ children }) => {
  const [sale, setSale] = useState(null);
  const [loadingSale, setLoadingSale] = useState(true);

  const fetchActiveSale = async () => {
    try {
      const activeSale = await getActiveSale();
      setSale(activeSale);
    } catch {
      setSale(null);
    } finally {
      setLoadingSale(false);
    }
  };

  useEffect(() => {
    fetchActiveSale();
  }, []);

  /**
   * Check if a specific product is included in the current sale.
   */
  const isProductOnSale = (productId) => {
    if (!sale || !sale.isActive) return false;
    if (sale.applyType === 'all') return true;
    if (sale.applyType === 'selected' && sale.productIds?.includes(productId)) return true;
    return false;
  };

  /**
   * Get the discounted price for a product.
   */
  const getDiscountedPrice = (price, productId) => {
    if (!sale || !sale.isActive) return price;
    if (!isProductOnSale(productId)) return price;

    if (sale.discountType === 'percentage') {
      return Math.round(price - (price * sale.discountValue) / 100);
    }
    if (sale.discountType === 'fixed') {
      return Math.max(0, price - sale.discountValue);
    }
    return price;
  };

  /**
   * Get the discount label (e.g. "-20%" or "-₹200").
   */
  const getDiscountLabel = () => {
    if (!sale || !sale.isActive) return '';
    if (sale.discountType === 'percentage') return `-${sale.discountValue}%`;
    if (sale.discountType === 'fixed') return `-₹${sale.discountValue}`;
    return '';
  };

  // Legacy compat — keep updateSale working for old code
  const updateSale = async () => {
    await fetchActiveSale();
  };

  return (
    <SaleContext.Provider value={{
      sale: sale || { active: false, percentage: 0, label: '' },
      activeSale: sale,
      loadingSale,
      updateSale,
      getDiscountedPrice,
      isProductOnSale,
      getDiscountLabel,
      refreshSale: fetchActiveSale,
    }}>
      {children}
    </SaleContext.Provider>
  );
};

export const useSale = () => {
  const ctx = useContext(SaleContext);
  if (!ctx) throw new Error('useSale must be inside SaleProvider');
  return ctx;
};
