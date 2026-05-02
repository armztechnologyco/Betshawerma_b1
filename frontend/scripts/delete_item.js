
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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
const db = getFirestore(app);

async function listAndDelete() {
  console.log('--- Categories ---');
  const catSnapshot = await getDocs(collection(db, 'inventory_categories'));
  catSnapshot.forEach(d => console.log(`- ${d.data().name} (ID: ${d.id})`));
  
  console.log('--- Recent Purchases ---');
  const purchSnapshot = await getDocs(collection(db, 'purchases'));
  purchSnapshot.forEach(d => console.log(`- ${d.data().itemName} (ID: ${d.id})`));
}

listAndDelete().catch(console.error);
