# VYBERA — Backup & Recovery Guide

## 1. Database (Firestore)

### Export Backup
1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
2. Click **Firestore Database** on the left menu
3. Click the **⋮** (three dots) menu → **Export all documents**
4. Select a Google Cloud Storage bucket → Export

### Import / Restore
1. Go to Firestore → **Import/Export**
2. Select the backup from your storage bucket → Import

### Recommended Schedule
- **Weekly manual export** of all collections
- Critical collections: `products`, `orders`, `customOrders`, `users`, `coupons`

---

## 2. Code (Git)

Your code is already backed up via Git + GitHub:
- Repository: `github.com/parth-meriya/vybera-website`
- Every push creates a permanent backup
- Vercel keeps deployment history (rollback anytime)

### Rollback a bad deployment
1. Go to Vercel Dashboard → **Deployments**
2. Find the last working deployment
3. Click **⋮** → **Promote to Production**

---

## 3. Images (Firebase Storage)

Product images are stored as Base64 in Firestore documents (not Firebase Storage), so they are automatically backed up with your Firestore export.

Custom order images are in Firebase Storage:
1. Go to Firebase Console → **Storage**
2. Download important files manually or use `gsutil` CLI:
   ```
   gsutil -m cp -r gs://your-bucket-name/customOrders ./backup/
   ```

---

## 4. Environment Variables

### Vercel (Frontend + API)
| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase client API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key (live) |
| `RAZORPAY_KEY_ID` | Razorpay key for API (live) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret for API (live) |

### Local (.env file — NOT in Git)
Keep a secure copy of your `.env` file in a password manager or encrypted storage.

---

## 5. Disaster Recovery Checklist

If your site goes down:
1. ✅ Check Vercel status: [vercel.com/status](https://vercel.com/status)
2. ✅ Check Firebase status: [status.firebase.google.com](https://status.firebase.google.com)
3. ✅ Rollback deployment on Vercel if code issue
4. ✅ Restore Firestore from last export if data issue
5. ✅ Re-add environment variables if project is recreated
