import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

// Lazy-initialize Firebase Admin SDK
function initAdmin() {
  if (!admin.apps.length) {
    let projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
    let rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;

    // Check if serviceAccountKey.json is available locally
    if ((!rawKey || typeof rawKey !== 'string') && existsSync('serviceAccountKey.json')) {
      try {
        const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
        projectId = projectId || sa.project_id;
        clientEmail = clientEmail || sa.client_email;
        rawKey = sa.private_key;
      } catch (err) {
        console.warn('Could not read serviceAccountKey.json:', err.message);
      }
    }

    if (!rawKey || typeof rawKey !== 'string') {
      throw new Error('CRITICAL CONFIG ERROR: Firebase Private Key is missing from your environment variables. Please add FIREBASE_PRIVATE_KEY to Vercel.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: rawKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });
  }
}

const ALLOWED_ORIGINS = [
  'https://vybera.shop',
  'https://www.vybera.shop',
  'http://localhost:5173',
  'http://localhost:5174',
];

// Utility: Random alphanumeric string generator
const generateCouponCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'VYB-';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Scaled Probabilities to 100%
const REWARDS = [
  { type: 'percentage', value: 20, name: '20% OFF', probability: 40, index: 0 },
  { type: 'percentage', value: 30, name: '30% OFF', probability: 30, index: 1 },
  { type: 'percentage', value: 50, name: '50% OFF', probability: 18, index: 2 },
  { type: 'percentage', value: 70, name: '70% OFF', probability: 10, index: 3 },
  { type: 'free_tee', value: null, name: 'FREE TEE', probability: 2, index: 4 },
];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    const { campaignId, preview = false } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    initAdmin();
    const db = admin.firestore();

    let uid = 'preview_tester';
    let userData = { email: 'preview@admin.local', name: 'Preview Tester' };
    let phoneNumber = '';
    let userEmail = 'preview@admin.local';

    // 1. Verify User (Required for live spins; optional for preview test spins)
    if (!preview) {
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
      }
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      uid = decodedToken.uid;

      const userSnap = await db.collection('users').doc(uid).get();
      userData = userSnap.exists ? userSnap.data() : {};
      phoneNumber = userData.phoneNumber || '';
      userEmail = userData.email || decodedToken.email || '';
    } else if (authHeader?.startsWith('Bearer ') && authHeader.split('Bearer ')[1] !== 'preview-test-token') {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
        const userSnap = await db.collection('users').doc(uid).get();
        userData = userSnap.exists ? userSnap.data() : {};
        phoneNumber = userData.phoneNumber || '';
        userEmail = userData.email || decodedToken.email || '';
      } catch {
        // In preview mode, allow fallback to test user
      }
    }

    // 2. Check if Campaign exists and is active
    const campaignSnap = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignSnap.exists || (!campaignSnap.data().active && !preview)) {
      return res.status(404).json({ error: 'This campaign is no longer active.' });
    }
    const campaignData = campaignSnap.data();

    // Check Campaign Schedule (Asia/Kolkata / IST)
    if (!preview) {
      const now = Date.now();
      if (campaignData.startDate) {
        const start = new Date(campaignData.startDate).getTime();
        if (!isNaN(start) && now < start) {
          return res.status(403).json({ 
            error: 'This Diwali campaign has not started yet.',
            startsAt: campaignData.startDate
          });
        }
      }
      if (campaignData.endDate) {
        const end = new Date(campaignData.endDate).getTime();
        if (!isNaN(end) && now > end) {
          return res.status(403).json({ 
            error: 'This Diwali campaign ended on 20 November 2026 IST.',
            endedAt: campaignData.endDate
          });
        }
      }
    }

    if (campaignData.usageLimit > 0 && (campaignData.totalSpins || 0) >= campaignData.usageLimit) {
      return res.status(403).json({ error: 'This campaign has reached its maximum participation limit.' });
    }

    // 3. Prevent Multiple Spins (strictly enforced for real live customer spins)
    if (!preview) {
      const spinsRef = db.collection('spinResults');
      const queries = [
        spinsRef.where('uid', '==', uid).where('campaignId', '==', campaignId).get()
      ];
      if (phoneNumber) {
        queries.push(spinsRef.where('phoneNumber', '==', phoneNumber).where('campaignId', '==', campaignId).get());
      }
      if (userEmail) {
        queries.push(spinsRef.where('email', '==', userEmail).where('campaignId', '==', campaignId).get());
      }

      const checkResults = await Promise.all(queries);
      const hasAlreadySpun = checkResults.some(snap => !snap.empty);

      if (hasAlreadySpun) {
        const existingSpin = checkResults.find(snap => !snap.empty)?.docs[0]?.data();
        return res.status(403).json({ 
          error: 'You have already claimed your Diwali gift for this year!',
          alreadySpun: true,
          previousReward: existingSpin?.rewardWon || null
        });
      }
    }

    // 4. Determine Reward (Server-side RNG with weighted probabilities)
    let roll = Math.random() * 100;
    let selectedReward = REWARDS[0]; // Default fallback

    const campaignRewards = campaignData.rewards && campaignData.rewards.length > 0 ? campaignData.rewards : REWARDS;

    let cumulative = 0;
    for (const reward of campaignRewards) {
      cumulative += reward.probability;
      if (roll <= cumulative) {
        selectedReward = reward;
        break;
      }
    }

    // 5. Handle Preview Spins (Fast return without polluting customer production stats)
    if (preview) {
      const previewCode = `VYB-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
      return res.status(200).json({
        success: true,
        reward: selectedReward,
        couponCode: selectedReward.type === 'free_tee' ? null : previewCode,
        preview: true,
      });
    }

    // 6. Handle Live Production Spin via Firestore Transaction
    let generatedCode = null;

    await db.runTransaction(async (transaction) => {
      // Create spin result record
      const newSpinRef = db.collection('spinResults').doc();
      transaction.set(newSpinRef, {
        uid,
        phoneNumber,
        email: userData.email || '',
        name: userData.name || '',
        campaignId,
        rewardWon: selectedReward.name,
        rewardType: selectedReward.type,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update analytics counter
      const analyticsRef = db.collection('campaigns').doc(campaignId);
      transaction.update(analyticsRef, {
        totalSpins: admin.firestore.FieldValue.increment(1)
      });

      // If it's a discount, create a single-use coupon with collision check
      if (selectedReward.type === 'percentage' || selectedReward.type === 'flat') {
        let codeIsUnique = false;
        let attempts = 0;
        while (!codeIsUnique && attempts < 5) {
          generatedCode = generateCouponCode(6);
          const existingCoupon = await db.collection('coupons').where('code', '==', generatedCode).get();
          if (existingCoupon.empty) {
            codeIsUnique = true;
          }
          attempts++;
        }
        if (!codeIsUnique) {
          throw new Error('Failed to generate a unique coupon code. Please try again.');
        }

        const expiryDays = campaignData.expiryDays || 14;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        const newCouponRef = db.collection('coupons').doc();
        transaction.set(newCouponRef, {
          code: generatedCode,
          type: selectedReward.type,
          value: selectedReward.value,
          singleUse: true,
          used: false,
          uid: uid,
          campaignId: campaignId,
          active: true,
          expiry: expiryDate.toISOString(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } 
      // If it's a FREE TEE, create a reward transaction for admin approval
      else if (selectedReward.type === 'free_tee') {
        const rewardTxRef = db.collection('rewardTransactions').doc();
        transaction.set(rewardTxRef, {
          userId: uid,
          email: userData.email || '',
          phone: phoneNumber,
          type: 'FREE_TEE',
          campaignId: campaignId,
          status: 'pending',
          description: `Won FREE TEE in ${campaignId} campaign.`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Add notification to user profile about the reward won
      const userRef = db.collection('users').doc(uid);
      const isFreeTee = selectedReward.type === 'free_tee';
      transaction.update(userRef, {
        notifications: admin.firestore.FieldValue.arrayUnion({
          id: `notif_${Date.now()}_coupon_won`,
          type: 'promo',
          title: isFreeTee ? 'Diwali Free Tee Won! ✨' : 'Diwali Reward Won! ✨',
          message: isFreeTee 
            ? `Congratulations! You won a FREE TEE in the ${campaignData.name || campaignId}.`
            : `Congratulations! You won a ${selectedReward.name} coupon (${generatedCode}) in the ${campaignData.name || campaignId}.`,
          createdAt: new Date().toISOString(),
          read: false,
        })
      });
    });

    return res.status(200).json({ 
      success: true, 
      reward: selectedReward,
      couponCode: generatedCode
    });

  } catch (error) {
    console.error('[Spin API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
