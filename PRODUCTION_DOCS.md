# VYBERA — Production Documentation

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel     │     │   Firebase   │     │  Razorpay   │
│  (Frontend)  │────▶│  (Database)  │     │ (Payments)  │
│  + API fn    │     │  + Auth      │     │             │
└─────────────┘     │  + Storage   │     └─────────────┘
       │            └──────────────┘            ▲
       │                                        │
       └────────── /api/create-order ───────────┘
```

- **Frontend:** React (Vite) deployed on Vercel
- **Backend API:** Vercel Serverless Function (`/api/create-order`)
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (Email + Google)
- **Payments:** Razorpay (Live mode)
- **Domain:** vybera.shop (DNS via GoDaddy → Vercel)
- **Analytics:** Google Analytics 4 (G-638GY90H46)

---

## API Documentation

### POST `/api/create-order`

Creates a Razorpay order for payment processing.

**Request:**
```json
{
  "amount": 1499,
  "receipt": "vybera_abc123_1234567890"
}
```

**Response (200):**
```json
{
  "id": "order_xxxxxxxxxxxxx",
  "amount": 149900,
  "currency": "INR",
  "receipt": "vybera_abc123_1234567890"
}
```

**Error Responses:**
| Code | Reason |
|------|--------|
| 400 | Invalid amount (< ₹1 or > ₹50,000) |
| 403 | Unauthorized origin |
| 405 | Wrong HTTP method (not POST) |
| 429 | Rate limited (> 5 req/min per IP) |
| 500 | Razorpay API failure |

---

## Security Measures

| Protection | Implementation |
|------------|---------------|
| Rate Limiting | 5 req/IP/min on payment API |
| Origin Validation | Only vybera.shop allowed |
| Input Sanitization | Amount capped, receipt cleaned |
| HTTPS | Forced via HSTS header |
| Clickjacking | X-Frame-Options: DENY |
| XSS | X-XSS-Protection + CSP headers |
| MIME Sniffing | X-Content-Type-Options: nosniff |
| Admin Access | Firebase role-based (email check) |
| Secrets | Environment variables only (not in code) |
| Error Handling | Global ErrorBoundary catches crashes |

---

## Firestore Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `products` | Product catalog | name, price, originalPrice, category, sizes, images |
| `orders` | Shop orders | userId, products, address, paymentId, total, status |
| `customOrders` | Custom tee orders | userId, imageUrls, size, color, paymentId |
| `users` | User accounts | uid, name, email, role |
| `coupons` | Discount codes | code, type, value, active, expiry |
| `reviews` | Product reviews | productId, userId, rating, reviewText |
| `contacts` | Contact form | name, email, message |

---

## Deployment Workflow

1. Make changes locally
2. `git add . && git commit -m "message" && git push`
3. Vercel auto-deploys from `main` branch
4. Build completes in ~60 seconds
5. Live at vybera.shop

### Rollback
Vercel Dashboard → Deployments → Find working build → Promote to Production

---

## Environment Variables

See `BACKUP_GUIDE.md` for the complete list.

---

## Monitoring

- **Error Tracking:** ErrorBoundary component catches React crashes
- **Analytics:** Google Analytics 4 tracks page views, purchases, add-to-cart events
- **Vercel Logs:** Runtime logs available in Vercel Dashboard → Functions tab
- **Uptime:** Vercel provides built-in uptime monitoring

---

## Key Files

| File | Purpose |
|------|---------|
| `api/create-order.js` | Payment API (rate limited) |
| `src/components/SEO.jsx` | Per-page SEO meta tags |
| `src/components/ErrorBoundary.jsx` | Global crash handler |
| `src/utils/analytics.js` | GA4 event tracking |
| `src/utils/razorpay.js` | Payment flow logic |
| `src/firebase/config.js` | Firebase initialization |
| `vercel.json` | Security headers + routing |
| `public/sitemap.xml` | SEO sitemap |
| `public/robots.txt` | Search engine crawl rules |
