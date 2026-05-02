import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'vybera_cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [coupon, setCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, size, quantity = 1) => {
    if (product.inStock === false) return; // Disallow adding out of stock items
    setItems(prev => {
      const existIdx = prev.findIndex(
        i => i.id === product.id && i.size === size
      );
      if (existIdx >= 0) {
        const updated = [...prev];
        updated[existIdx] = {
          ...updated[existIdx],
          quantity: updated[existIdx].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { ...product, size, quantity }];
    });
  };

  const removeItem = (productId, size) => {
    setItems(prev => prev.filter(i => !(i.id === productId && i.size === size)));
  };

  const updateQuantity = (productId, size, qty) => {
    if (qty <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.id === productId && i.size === size ? { ...i, quantity: qty } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    setDiscount(0);
    localStorage.removeItem(CART_KEY);
  };

  const applyCoupon = (couponData, discountAmount) => {
    setCoupon(couponData);
    setDiscount(discountAmount);
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = Math.max(subtotal - discount, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        coupon,
        discount,
        applyCoupon,
        removeCoupon,
        subtotal,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
