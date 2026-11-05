import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(FIREBASE_CONFIG);
  // Persist the login between app launches.
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  // Long-polling is more reliable than WebSockets on many React Native networks.
  db = initializeFirestore(app, { ignoreUndefinedProperties: true, experimentalAutoDetectLongPolling: true });
} else {
  app = getApp();
  auth = getAuth(app);
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
}

export { app, auth, db };
