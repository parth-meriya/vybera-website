import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const playAddSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Browsers might block audio if user hasn't interacted yet
    }
  };

  const addItem = (product, size, quantity = 1, isCustom = false) => {
    if (product.inStock === false) return; 
    
    // Play feedback sound
    playAddSound();
    toast.success(`${isCustom ? 'Custom Design' : product.name} added to cart`, { className: 'toast-vybera' });

    setItems(prev => {
      // Custom items are always added as unique entries because they have unique designs
      if (isCustom) {
        return [...prev, { ...product, size, quantity, isCustom: true, cartId: `custom_${Date.now()}` }];
      }

      const existIdx = prev.findIndex(
        i => !i.isCustom && i.id === product.id && i.size === size && i.selectedColor === product.selectedColor
      );
      if (existIdx >= 0) {
        const updated = [...prev];
        updated[existIdx] = {
          ...updated[existIdx],
          quantity: updated[existIdx].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { ...product, size, quantity, isCustom: false }];
    });
  };

  const removeItem = (productId, size, color, cartId) => {
    setItems(prev => prev.filter(i => {
      if (cartId && i.cartId === cartId) return false;
      if (!cartId && !i.isCustom && i.id === productId && i.size === size && i.selectedColor === color) return false;
      return true;
    }));
  };

  const updateQuantity = (productId, size, color, qty, cartId) => {
    if (qty <= 0) {
      removeItem(productId, size, color, cartId);
      return;
    }
    setItems(prev =>
      prev.map(i => {
        if (cartId && i.cartId === cartId) return { ...i, quantity: qty };
        if (!cartId && !i.isCustom && i.id === productId && i.size === size && i.selectedColor === color) return { ...i, quantity: qty };
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    setDiscount(0);
    localStorage.removeItem(CART_KEY);
  };

  const applyCoupon = (couponData) => {
    setCoupon(couponData);
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  
  // Recalculate discount dynamically
  let validDiscount = 0;
  if (coupon) {
    // 1. Check min order
    if (!coupon.minOrder || subtotal >= coupon.minOrder) {
      // 2. Calculate by type
      if (coupon.type === 'percentage') {
        validDiscount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount) {
          validDiscount = Math.min(validDiscount, coupon.maxDiscount);
        }
      } else {
        validDiscount = coupon.value;
      }
    }
  }

  validDiscount = Math.round(validDiscount);

  const total = Math.max(subtotal - validDiscount, 0);
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
        discount: validDiscount,
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
