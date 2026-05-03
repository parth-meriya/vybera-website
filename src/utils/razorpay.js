/**
 * VYBERA Razorpay Integration
 *
 * Flow:
 * 1. Call /api/create-order (server-side, uses Key Secret) → get razorpayOrderId
 * 2. Load Razorpay checkout.js SDK
 * 3. Open payment modal with order_id + key_id
 * 4. On success: store paymentId, orderId, signature in Firestore
 */

/**
 * Dynamically load the Razorpay checkout SDK.
 * @returns {Promise<boolean>} true if loaded successfully
 */
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create a Razorpay order via our backend API.
 * @param {number} amount - Final amount in ₹ (after discount)
 * @param {string} receipt - Unique receipt ID
 * @returns {Promise<{id: string, amount: number, currency: string}>}
 */
export const createRazorpayOrder = async (amount, receipt) => {
  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, receipt }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Order creation failed (${response.status})`);
  }

  return response.json();
};

/**
 * Full Razorpay payment flow:
 * 1. Creates backend order → 2. Opens SDK checkout → 3. Calls success/failure handlers
 *
 * @param {Object} options
 * @param {number}   options.amount       - Final ₹ amount to charge
 * @param {string}   options.receipt      - Unique receipt (e.g. user email + timestamp)
 * @param {string}   options.description  - Short payment description
 * @param {Object}   options.prefill      - { name, email, contact }
 * @param {Function} options.onSuccess    - Called with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * @param {Function} options.onFailure    - Called on payment failure or modal dismiss
 */
export const openRazorpay = async ({
  amount,
  receipt,
  description,
  prefill = {},
  onSuccess,
  onFailure,
}) => {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // ── Step 1: Load SDK ────────────────────────────────────────
  const sdkLoaded = await loadRazorpay();
  if (!sdkLoaded) {
    throw new Error('Razorpay SDK failed to load. Check your internet connection.');
  }

  // ── Step 2: Create Order on Backend ─────────────────────────
  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder(amount, receipt);
  } catch (err) {
    console.error('[Razorpay] Backend order creation failed:', err.message);
    if (onFailure) onFailure({ reason: 'backend_failure', message: err.message });
    return { success: false, reason: 'backend_failure', error: err.message };
  }

  // ── Step 3: Open Checkout ────────────────────────────────────
  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: Math.round(amount * 100),  // paise — matches backend order
      currency: 'INR',
      name: 'VYBERA',
      description: description || 'VYBERA Order',
      image: '/favicon.svg',
      order_id: razorpayOrder.id,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || '',
      },
      notes: {
        receipt: receipt || '',
        platform: 'VYBERA',
      },
      theme: {
        color: '#f0f0f0',
        backdrop_color: 'rgba(8,8,8,0.9)',
      },
      modal: {
        confirm_close: true,
        animation: true,
        ondismiss: () => {
          if (onFailure) onFailure({ reason: 'dismissed' });
          resolve({ success: false, reason: 'dismissed' });
        },
      },
      handler: (response) => {
        // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        if (onSuccess) onSuccess({ ...response, backendOrderId: razorpayOrder?.id });
        resolve({ success: true, ...response, backendOrderId: razorpayOrder?.id });
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      console.error('[Razorpay] Payment failed:', response.error);
      if (onFailure) onFailure(response.error);
      resolve({ success: false, error: response.error });
    });

    rzp.open();
  });
};
