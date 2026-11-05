import {
  createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail,
  signInWithCredential, signInWithEmailAndPassword, signOut, updateProfile, type User,
} from 'firebase/auth';
import { create } from 'zustand';
import { FIREBASE_CONFIGURED } from '../lib/config';
import { auth } from '../lib/firebase';

export function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email': return 'That email address does not look right.';
    case 'auth/missing-password': return 'Please enter your password.';
    case 'auth/weak-password': return 'Choose a password with at least 6 characters.';
    case 'auth/email-already-in-use': return 'An account with this email already exists. Try logging in.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email or password is incorrect.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed': return 'No internet connection. Check your network and try again.';
    default: return (e as Error)?.message ?? 'Something went wrong. Please try again.';
  }
}

interface AuthState {
  user: User | null;
  /** false until Firebase has told us whether someone is logged in */
  ready: boolean;
  init: () => () => void;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  init: () => {
    if (!FIREBASE_CONFIGURED) {
      set({ ready: true });
      return () => {};
    }
    return onAuthStateChanged(auth, (user) => set({ user, ready: true }));
  },
  signUp: async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    set({ user: auth.currentUser });
  },
  signIn: async (email, password) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  },
  signInWithGoogle: async (idToken) => {
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  },
  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email.trim());
  },
  logout: async () => {
    await signOut(auth);
  },
}));
