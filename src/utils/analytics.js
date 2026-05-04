/**
 * VYBERA Analytics — Google Analytics Event Tracking
 * 
 * Wraps gtag() calls for type-safe, consistent event tracking.
 * All events are sent to GA4 (G-638GY90H46).
 */

const GA_ID = 'G-638GY90H46';

const gtag = (...args) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

// ── Page Views (auto-tracked by GA, but useful for SPA route changes) ──
export const trackPageView = (path, title) => {
  gtag('config', GA_ID, {
    page_path: path,
    page_title: title,
  });
};

// ── E-Commerce Events ─────────────────────────────────────────

/** User adds a product to cart */
export const trackAddToCart = (product, size, quantity = 1) => {
  gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: product.price * quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category || 'normal',
      price: product.price,
      quantity,
      item_variant: size,
    }],
  });
};

/** User begins checkout */
export const trackBeginCheckout = (items, total) => {
  gtag('event', 'begin_checkout', {
    currency: 'INR',
    value: total,
    items: items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
      item_variant: i.size,
    })),
  });
};

/** Successful purchase */
export const trackPurchase = (orderId, total, items = []) => {
  gtag('event', 'purchase', {
    transaction_id: orderId,
    currency: 'INR',
    value: total,
    items: items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
      item_variant: i.size,
    })),
  });
};

/** User views a product */
export const trackViewProduct = (product) => {
  gtag('event', 'view_item', {
    currency: 'INR',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category || 'normal',
      price: product.price,
    }],
  });
};

/** Custom event for signup/login */
export const trackSignUp = (method = 'email') => {
  gtag('event', 'sign_up', { method });
};

export const trackLogin = (method = 'email') => {
  gtag('event', 'login', { method });
};

/** Custom event for custom tee order */
export const trackCustomOrder = (price) => {
  gtag('event', 'custom_order', {
    currency: 'INR',
    value: price,
  });
};
