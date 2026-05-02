import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

export const signUp = async (email, password, name) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCred.user, { displayName: name });
  const role = email === 'panugamer5858@gmail.com' ? 'admin' : 'user';

  // Save user to Firestore
  await setDoc(doc(db, 'users', userCred.user.uid), {
    uid: userCred.user.uid,
    name,
    email,
    role: role,
    createdAt: serverTimestamp(),
  });
  return userCred.user;
};

export const signIn = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
};

export const signInWithGoogle = async () => {
  const userCred = await signInWithPopup(auth, googleProvider);
  const userRef = doc(db, 'users', userCred.user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: userCred.user.uid,
      name: userCred.user.displayName,
      email: userCred.user.email,
      role: userCred.user.email === 'panugamer5858@gmail.com' ? 'admin' : 'user',
      createdAt: serverTimestamp(),
    });
  }
  return userCred.user;
};

export const logOut = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const getUserRole = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) return snap.data().role;
  return 'user';
};

export const isAdmin = async (uid) => {
  const role = await getUserRole(uid);
  return role === 'admin';
};
