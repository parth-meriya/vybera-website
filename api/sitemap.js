import admin from 'firebase-admin';

// Lazy-initialize Firebase Admin SDK (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY)?.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
    }),
  });
}

const SITE_URL = 'https://vybera.shop';

const STATIC_PATHS = [
  '/',
  '/shop',
  '/about',
  '/contact',
  '/customize',
  '/couple',
  '/kids',
  '/privacy-policy',
  '/terms',
  '/refund-policy',
  '/shipping-policy'
];

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache on CDN for 1 day

  try {
    const db = admin.firestore();
    const productsSnap = await db.collection('products').get();
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Static Pages
    STATIC_PATHS.forEach(path => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${path}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${path === '/' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Dynamic Product Pages
    products.forEach(prod => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/product/${prod.id}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    // Return fallback static sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    STATIC_PATHS.forEach(path => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${path}</loc>\n`;
      xml += `  </url>\n`;
    });
    xml += `</urlset>`;
    return res.status(200).send(xml);
  }
}
