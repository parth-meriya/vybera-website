/**
 * NEXVRA — Razorpay Order Creation
 * Vercel Serverless Function: /api/create-order
 *
 * POST /api/create-order
 * Body: { amount: number (₹), receipt: string }
 * Returns: Razorpay order object { id, amount, currency, receipt }
 */

import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, receipt } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert ₹ to paise
      currency: 'INR',
      receipt: receipt || `nexvra_${Date.now()}`,
      notes: {
        platform: 'NEXVRA',
        mode: 'test',
      },
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return res.status(500).json({
      error: error.error?.description || error.message || 'Order creation failed',
    });
  }
}
