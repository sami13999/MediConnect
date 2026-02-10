import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if placeholders are still present
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let db: any = null;
let storage: any = null;

if (isConfigured) {
  // FIX: Check if app is already initialized
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  console.warn("⚠️ Firebase is not configured. Placeholders detected in firebaseConfig.ts.");
}

export { db, storage };