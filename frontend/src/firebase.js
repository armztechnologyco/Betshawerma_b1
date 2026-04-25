import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA5euiGZrVNsmToxazw7UKko6Ny1BwdgRA",
  authDomain: "betshawerma-2e5eb.firebaseapp.com",
  databaseURL: "https://betshawerma-2e5eb-default-rtdb.firebaseio.com",
  projectId: "betshawerma-2e5eb",
  storageBucket: "betshawerma-2e5eb.firebasestorage.app",
  messagingSenderId: "885353701827",
  appId: "1:885353701827:web:633527a94dd987c4b2dd76",
  measurementId: "G-JJRNLJ4535"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

export default app;