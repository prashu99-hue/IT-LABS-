import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpez425YC8Hs3O1-_YpkI77EgSiKpDgXI",
  authDomain: "it-labs-47fb8.firebaseapp.com",
  projectId: "it-labs-47fb8",
  storageBucket: "it-labs-47fb8.firebasestorage.app",
  messagingSenderId: "771449654547",
  appId: "1:771449654547:web:e69725a9da550b83869ee6",
  measurementId: "G-6QB45DYFNO"
};

// Initialize Firebase exactly once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect Firebase Authentication (persistent sessions)
export const auth = getAuth(app);

// Connect Cloud Firestore
export const db = getFirestore(app);

// Note: Firebase Storage is intentionally NOT initialized as per user requirement (zero-cost college project, no Blaze billing).

// Validation connection test
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client appears to be offline. Check network connection.");
    }
    // Expected if 'test/connection' does not exist yet or requires auth
    return false;
  }
}
