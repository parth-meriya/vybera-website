import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../_lib/firebase-admin';

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
    
    // Verify user is authenticated
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email; // Should be the Google email

    const { phoneNumber, otp, name, gender } = req.body;
    
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const otpRef = db.collection('otps').doc(cleanPhone);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const otpData = otpDoc.data();

    // Check expiration
    if (otpData.expiresAt.toDate() < new Date()) {
      await otpRef.delete();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (otpData.attempts >= 5) {
      await otpRef.delete();
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify UID matches the one who requested it
    if (otpData.uid !== uid) {
      return res.status(403).json({ error: 'Unauthorized attempt.' });
    }

    // Verify OTP matches
    if (otpData.otp !== otp) {
      await otpRef.update({ attempts: FieldValue.increment(1) });
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // OTP is valid! Let's check for duplicate phone number one last time just in case
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('phoneNumber', '==', cleanPhone).limit(1).get();
    
    if (!existingUser.empty) {
      // Very unlikely race condition, but still
      return res.status(400).json({ error: 'This phone number is already registered.' });
    }

    // Create the official user document
    const cleanName = name ? name.trim() : (decodedToken.name || '');
    
    await usersRef.doc(uid).set({
      uid: uid,
      name: cleanName,
      email: email,
      phoneNumber: cleanPhone,
      gender: gender || null,
      role: 'user',
      emailVerified: true,
      provider: 'google',
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp()
    });

    // Delete the OTP document so it can't be reused
    await otpRef.delete();

    return res.status(200).json({ success: true, message: 'Profile verified successfully' });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
}
