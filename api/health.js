/**
 * VYBERA API Health Check
 * Used by the frontend to verify backend connectivity before payment initiation.
 */

export default function handler(req, res) {
  const ALLOWED_ORIGINS = [
    'https://vybera.shop',
    'https://www.vybera.shop',
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
}
