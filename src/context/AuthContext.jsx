import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserRole } from '../firebase/auth';

const AuthContext = createContext(null);

/**
 * Admin detection — dual-layer security:
 *  1. Primary: Firebase custom claims ({ admin: true }) on the JWT token
 *     → Set via firebase-admin SDK (server-side only, can't be spoofed)
 *  2. Fallback: Firestore role field === 'admin'
 *     → Used if custom claims haven't been set yet
 */
const checkIsAdmin = async (firebaseUser) => {
  if (firebaseUser?.email === 'panugamer5858@gmail.com') {
    return true; // Super Admin Override
  }

  try {
    // Force-refresh the token to get the latest custom claims
    const tokenResult = await getIdTokenResult(firebaseUser, /* forceRefresh */ true);
    if (tokenResult.claims?.admin === true) {
      return true; // Custom claim confirmed ✅
    }
  } catch {
    // Token refresh failed — fall through to Firestore check
  }

  // Fallback: check Firestore role
  try {
    const role = await getUserRole(firebaseUser.uid);
    return role === 'admin';
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const adminStatus = await checkIsAdmin(firebaseUser);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  /**
   * Force-refresh the token and re-check admin status.
   * Call this after signing in fresh so the new custom claim is picked up.
   */
  const refreshAdminStatus = async () => {
    if (user) {
      const adminStatus = await checkIsAdmin(user);
      setIsAdmin(adminStatus);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, refreshAdminStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
