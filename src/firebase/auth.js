import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential,
  unlink,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import {
  validateName,
  validatePhone,
  validatePassword as validatePasswordRules,
  validatePasswordNotEmail,
  sanitizeInput,
  sanitizeName,
} from '../utils/validation';

const googleProvider = new GoogleAuthProvider();
// Always re-prompt account selection for security
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Password Policy ───────────────────────────────────────────
/**
 * Validate password meets VYBERA security policy:
 * - 8+ characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 * - Must NOT be the same as the user's email
 */
export const validatePassword = (password, email = '') => {
  const errors = validatePasswordRules(password);
  // Check password ≠ email
  const emailCheck = validatePasswordNotEmail(password, email);
  if (emailCheck) errors.push(emailCheck);
  return errors;
};

// ── Sign Up ───────────────────────────────────────────────────
export const signUp = async (email, password, name, phoneNumber) => {
  // Sanitize all inputs
  const cleanName = sanitizeName(name).trim();
  const cleanEmail = sanitizeInput(email).trim().toLowerCase();
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');

  // Validate name (letters and spaces only)
  const nameError = validateName(cleanName);
  if (nameError) throw new Error(nameError);

  // Validate phone (Indian 10-digit mobile)
  const phoneError = validatePhone(cleanPhone);
  if (phoneError) throw new Error(phoneError);

  // Enforce password policy (includes password ≠ email check)
  const policyErrors = validatePassword(password, cleanEmail);
  if (policyErrors.length > 0) {
    throw new Error(`Password must contain ${policyErrors[0]}.`);
  }

  const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);

  try {
    await updateProfile(userCred.user, { displayName: cleanName });
    
    // Send verification email immediately after account creation
    await sendEmailVerification(userCred.user);

    // All new users get 'user' role — admin must be set server-side via Firebase Admin SDK
    await setDoc(doc(db, 'users', userCred.user.uid), {
      uid: userCred.user.uid,
      name: cleanName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      role: 'user',           // Never trust client for role assignment
      emailVerified: false,
      provider: 'email',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Rollback auth creation if DB fails
    await userCred.user.delete().catch(() => {});
    throw error;
  }

  return userCred.user;
};

// ── Sign In (Email/Password) ──────────────────────────────────
export const signIn = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  // Block login if email not verified (unless admin — admin bypass handled by custom claims)
  if (!userCred.user.emailVerified) {
    // Sign out the unverified user immediately
    await signOut(auth);
    throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
  }

  return userCred.user;
};

// ── Google OAuth (Secure) ─────────────────────────────────────
export const signInWithGoogle = async () => {
  // 1. Trigger the popup to get user credentials/email
  const result = await signInWithPopup(auth, googleProvider);
  const { user } = result;

  // 2. Check existing Firestore record for this user
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    
    // CASE 1: If account was originally 'email' but now has Google (via auto-link), block it
    // This happens if an attacker created a password account first.
    // Legitimate linking MUST happen through linkGoogleAccount() while signed in.
    const providers = user.providerData.map(p => p.providerId);
    if (data.provider === 'email' && providers.includes('password')) {
      await signOut(auth);
      const error = new Error('This email is already registered using password login. Please login using password first and then link Google account securely.');
      error.code = 'custom/account-exists-with-password';
      throw error;
    }

    // CASE 2 & 3: Already Google-only or properly linked — allow normally
    await setDoc(userRef, {
      ...data,
      emailVerified: true,
      lastLoginAt: serverTimestamp(),
    }, { merge: true });

    return { user, needsOnboarding: false };
  } else {
    // New Google user (needs onboarding)
    // We DO NOT create the Firestore document here anymore.
    // It will be created by the backend verify-otp API after phone verification.
    return { user, needsOnboarding: true };
  }
};

// ── Secure Provider Linking (Case 3) ──────────────────────────
export const linkGoogleAccount = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in to link accounts.');
  
  try {
    await linkWithCredential(currentUser, googleProvider);
    
    // Update provider in Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, { provider: 'google-linked' }, { merge: true });
    
    return currentUser;
  } catch (error) {
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('This Google account is already linked to another user.');
    }
    throw error;
  }
};

// ── Sign Out ──────────────────────────────────────────────────
export const logOut = async () => {
  await signOut(auth);
  // Clear any local caches
  try {
    localStorage.removeItem('vy_banner_config');
    localStorage.removeItem('vy_customize_settings');
  } catch {
    // localStorage may not be available
  }
};

// ── Auth State Change ─────────────────────────────────────────
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// ── Get User Role (from Firestore) ───────────────────────────
export const getUserRole = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data().role;
    return 'user';
  } catch {
    return 'user';
  }
};

// ── Admin Check (for internal use) ───────────────────────────
export const isAdmin = async (uid) => {
  const role = await getUserRole(uid);
  return role === 'admin';
};

// ── Resend Verification Email ─────────────────────────────────
export const resendVerificationEmail = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No user is currently signed in.');
  if (currentUser.emailVerified) throw new Error('Email is already verified.');
  await sendEmailVerification(currentUser);
};

export const resendVerificationEmailWithCredentials = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  if (userCred.user.emailVerified) throw new Error('Email is already verified.');
  await sendEmailVerification(userCred.user);
  await signOut(auth);
};

// ── Password Reset ────────────────────────────────────────────
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};
