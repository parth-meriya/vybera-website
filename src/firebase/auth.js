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
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

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
 */
export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('a number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push('a special character');
  return errors;
};

// ── Sign Up ───────────────────────────────────────────────────
export const signUp = async (email, password, name) => {
  // Enforce password policy before Firebase call
  const policyErrors = validatePassword(password);
  if (policyErrors.length > 0) {
    throw new Error(`Password must contain ${policyErrors.join(', ')}.`);
  }

  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  try {
    await updateProfile(userCred.user, { displayName: name });
    
    // Send verification email immediately after account creation
    await sendEmailVerification(userCred.user);

    // All new users get 'user' role — admin must be set server-side via Firebase Admin SDK
    await setDoc(doc(db, 'users', userCred.user.uid), {
      uid: userCred.user.uid,
      name,
      email,
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
  const userCred = await signInWithPopup(auth, googleProvider);
  const { user } = userCred;

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // New Google user — create profile with 'user' role only
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      role: 'user',         // Never trust client for role assignment
      emailVerified: true,  // Google accounts are pre-verified
      provider: 'google',
      createdAt: serverTimestamp(),
    });
  } else {
    // Existing user — update emailVerified status but PRESERVE existing role
    const existingData = snap.data();
    await setDoc(userRef, {
      ...existingData,
      emailVerified: true,
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  }

  return user;
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
