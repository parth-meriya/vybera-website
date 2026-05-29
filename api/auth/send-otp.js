import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../_lib/firebase-admin'; // Assume this exists from previous APIs

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = getFirebaseAdmin();
    const auth = getAuth(admin);
    const db = getFirestore(admin);

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify user is actually authenticated
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Check if phone number is already registered to another user
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('phoneNumber', '==', cleanPhone).limit(1).get();
    
    if (!existingUser.empty) {
      // The phone number is already attached to a user!
      // To prevent account takeover or duplicate phones:
      return res.status(400).json({ error: 'This phone number is already registered with another account.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiry (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save to Firestore
    await db.collection('otps').doc(cleanPhone).set({
      otp: otp, // In a real prod app, hash this using bcrypt before storing
      uid: uid,
      expiresAt: expiresAt,
      attempts: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    // ==========================================
    // SIMULATE SMS PROVIDER
    // ==========================================
    console.log(`\n\n=== 🚨 OTP FOR ${cleanPhone} IS: ${otp} 🚨 ===\n\n`);
    
    // Returning the OTP in development for easier testing
    // Remove this in production!
    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      _devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined 
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}
