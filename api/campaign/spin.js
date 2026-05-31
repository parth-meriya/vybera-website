import admin from 'firebase-admin';

// Lazy-initialize Firebase Admin SDK
function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY)?.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
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
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const idToken = authHeader.split('Bearer ')[1];

    const { campaignId } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    // 1. Verify User
    initAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const db = admin.firestore();
    const userSnap = await db.collection('users').doc(uid).get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    const userData = userSnap.data();

    if (!userData.phoneNumber) {
      return res.status(400).json({ error: 'Mobile number is required to participate in campaigns.', needsPhone: true });
    }

    const phoneNumber = userData.phoneNumber;

    // 2. Check if Campaign exists and is active
    const campaignSnap = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignSnap.exists || !campaignSnap.data().active) {
      return res.status(404).json({ error: 'This campaign is no longer active.' });
    }
    const campaignData = campaignSnap.data();

    if (campaignData.usageLimit > 0 && (campaignData.totalSpins || 0) >= campaignData.usageLimit) {
      return res.status(403).json({ error: 'This campaign has reached its maximum participation limit.' });
    }

    // 3. Prevent Multiple Spins
    // We check if this exact uid OR this exact phoneNumber has already spun for this campaign.
    const spinsRef = db.collection('spinResults');
    
    const [uidSpins, phoneSpins] = await Promise.all([
      spinsRef.where('uid', '==', uid).where('campaignId', '==', campaignId).get(),
      spinsRef.where('phoneNumber', '==', phoneNumber).where('campaignId', '==', campaignId).get()
    ]);

    if (!uidSpins.empty || !phoneSpins.empty) {
      return res.status(403).json({ error: 'You have already participated in this campaign!' });
    }

    // 4. Determine Reward (Server-side RNG)
    let roll = Math.random() * 100;
    let selectedReward = REWARDS[0]; // Default fallback

    // If campaign has custom rewards, use them, otherwise use default
    const campaignRewards = campaignData.rewards && campaignData.rewards.length > 0 ? campaignData.rewards : REWARDS;

    let cumulative = 0;
    for (const reward of campaignRewards) {
      cumulative += reward.probability;
      if (roll <= cumulative) {
        selectedReward = reward;
        break;
      }
    }

    // 5. Generate and Store Reward securely using a Transaction to ensure atomic operation
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

      // Update analytics counter safely (or we can just aggregate later, but incrementing is nice)
      const analyticsRef = db.collection('campaigns').doc(campaignId);
      transaction.update(analyticsRef, {
        totalSpins: admin.firestore.FieldValue.increment(1)
      });

      // If it's a discount, create a single-use coupon
      if (selectedReward.type === 'percentage' || selectedReward.type === 'flat') {
        generatedCode = generateCouponCode(6);
        
        // Expiry date (e.g. 7 days from now, or campaign specific)
        const expiryDays = campaignData.expiryDays || 7;
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
