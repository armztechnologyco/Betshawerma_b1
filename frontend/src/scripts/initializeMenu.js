// import { db } from '../firebase';
// import { 
//   collection, 
//   addDoc, 
//   getDocs, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   query, 
//   orderBy 
// } from 'firebase/firestore';

// // Menu Categories
// export const MENU_CATEGORIES = {
//   SHAWARMA: 'shawarma',
//   PLATES: 'plates',
//   SANDWICHES: 'sandwiches',
//   SIDES: 'sides',
//   DRINKS: 'drinks'
// };

// // Get all menu items
// export const getMenuItems = async () => {
//   try {
//     const menuRef = collection(db, 'menu');
//     const q = query(menuRef, orderBy('category', 'asc'), orderBy('name', 'asc'));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   } catch (error) {
//     console.error('Error fetching menu:', error);
//     throw error;
//   }
// };

// // Add menu item
// export const addMenuItem = async (itemData) => {
//   try {
//     const menuRef = collection(db, 'menu');
//     const newItem = {
//       ...itemData,
//       createdAt: new Date().toISOString(),
//       available: true
//     };
//     const docRef = await addDoc(menuRef, newItem);
//     return { id: docRef.id, ...newItem };
//   } catch (error) {
//     console.error('Error adding menu item:', error);
//     throw error;
//   }
// };

// // Update menu item
// export const updateMenuItem = async (itemId, itemData) => {
//   try {
//     const itemRef = doc(db, 'menu', itemId);
//     await updateDoc(itemRef, {
//       ...itemData,
//       updatedAt: new Date().toISOString()
//     });
//     return { success: true };
//   } catch (error) {
//     console.error('Error updating menu item:', error);
//     throw error;
//   }
// };

// // Delete menu item
// export const deleteMenuItem = async (itemId) => {
//   try {
//     const itemRef = doc(db, 'menu', itemId);
//     await deleteDoc(itemRef);
//     return { success: true };
//   } catch (error) {
//     console.error('Error deleting menu item:', error);
//     throw error;
//   }
// };

// // Get extras
// export const getExtras = async () => {
//   try {
//     const extrasRef = collection(db, 'extras');
//     const q = query(extrasRef, orderBy('category', 'asc'));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   } catch (error) {
//     console.error('Error fetching extras:', error);
//     throw error;
//   }
// };

// // Add extra
// export const addExtra = async (extraData) => {
//   try {
//     const extrasRef = collection(db, 'extras');
//     const newExtra = {
//       ...extraData,
//       createdAt: new Date().toISOString()
//     };
//     const docRef = await addDoc(extrasRef, newExtra);
//     return { id: docRef.id, ...newExtra };
//   } catch (error) {
//     console.error('Error adding extra:', error);
//     throw error;
//   }
// };

import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query
} from 'firebase/firestore';


const menuRef = collection(db, 'menu');

// ✅ REALTIME LISTENER
export const subscribeToMenu = (callback) => {
  const q = query(menuRef);

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    callback(grouped);
  });
};

// ➕ ADD
export const addMenuItem = async (item) => {
  return await addDoc(menuRef, {
    ...item,
    createdAt: new Date().toISOString()
  });
};

// ✏️ UPDATE
export const updateMenuItem = async (id, item) => {
  const ref = doc(db, 'menu', id);
  return await updateDoc(ref, item);
};

// ❌ DELETE
export const deleteMenuItem = async (id) => {
  return await deleteDoc(doc(db, 'menu', id));
};