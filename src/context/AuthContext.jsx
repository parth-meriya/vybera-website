import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getUserRole } from '../firebase/auth';

const AuthContext = createContext(null);

/**
 * Admin detection — dual-layer security:
 *  1. Primary: Firebase custom claims ({ admin: true }) on the JWT token
 *     → Set via firebase-admin SDK (server-side only, cannot be spoofed by clients)
 *  2. Fallback: Firestore role field === 'admin'
 *     → Used if custom claims haven't propagated yet after admin assignment
 *
 * NOTE: There is NO hardcoded email bypass. Admin privileges must be
 * granted through the Firebase Admin SDK on the backend only.
 */
const checkIsAdmin = async (firebaseUser) => {
  if (!firebaseUser) return false;

  try {
    // Force-refresh the token to get the latest custom claims
    const tokenResult = await getIdTokenResult(firebaseUser, /* forceRefresh */ true);
    if (tokenResult.claims?.admin === true) {
      return true; // Firebase custom claim confirmed ✅
    }
  } catch {
    // Token refresh failed — fall through to Firestore check
  }

  // Fallback: check Firestore role field
  try {
    const role = await getUserRole(firebaseUser.uid);
    return role === 'admin';
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const adminStatus = await checkIsAdmin(firebaseUser);
        setIsAdmin(adminStatus);

        // Listen to Firestore user profile document
        let isFirstSnapshot = true;
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile(null);
          }
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            setLoading(false);
          }
        });
      } else {
        setIsAdmin(false);
        setUserProfile(null);
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  /**
   * Force-refresh the token and re-check admin status.
   * Call this after a fresh sign-in so new custom claims are picked up.
   */
  const refreshAdminStatus = useCallback(async () => {
    if (user) {
      const adminStatus = await checkIsAdmin(user);
      setIsAdmin(adminStatus);
    }
  }, [user]);

  /**
   * Get the current user's Firebase ID token for backend calls.
   * Always returns a fresh token.
   */
  const getIdToken = useCallback(async () => {
    if (!user) return null;
    try {
      return await user.getIdToken(/* forceRefresh */ true);
    } catch {
      return null;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, isAdmin, loading, refreshAdminStatus, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
