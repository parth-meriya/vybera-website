/**
 * VYBERA — Production API Server
 *
 * Prepared for deployment on Render.
 * Provides backend services like Razorpay order creation.
 */

import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env manually (Vite handles this for the frontend, but Node needs it separately)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  });
} catch {
  console.warn('Could not read .env file');
}

const app = express();

// CORS setup for production
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    console.log(`[Razorpay] Creating order: ₹${amount}`);

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // ₹ → paise
      currency: 'INR',
      receipt: receipt || `vybera_${Date.now()}`,
      notes: { platform: 'VYBERA', environment: process.env.NODE_ENV || 'production' },
    });

    console.log(`[Razorpay] Order created: ${order.id}`);
    return res.json({ id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt });
  } catch (error) {
    console.error('[Razorpay] Error:', error.error?.description || error.message);
    return res.status(500).json({ error: error.error?.description || error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VYBERA Production API' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 VYBERA API Server running on port ${PORT}`);
  console.log(`   Health Check: GET /api/health`);
  console.log(`   Razorpay: POST /api/create-order\n`);
});
