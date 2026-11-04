import Razorpay from 'razorpay';

/**
 * Returns a configured Razorpay instance with sanitized credentials.
 */
export function getRazorpayClient() {
  const key_id = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim().replace(/^["']|["']$/g, '');
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '').trim().replace(/^["']|["']$/g, '');

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials missing on server. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  return new Razorpay({ key_id, key_secret });
}

/**
 * Returns sanitized Razorpay key secret for HMAC signature verification.
 */
export function getRazorpaySecret() {
  return (process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '').trim().replace(/^["']|["']$/g, '');
}
