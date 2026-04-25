// import { db } from '../firebase';
// import { 
//   collection, 
//   addDoc, 
//   getDocs, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   query, 
//   orderBy,
//   onSnapshot
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


// // 🔴 ADD THIS AT THE VERY END OF FILE
// export const subscribeToMenu = (callback) => {
//   const menuRef = collection(db, 'menu');
//   const q = query(menuRef, orderBy('category', 'asc'), orderBy('name', 'asc'));

//   return onSnapshot(q, (snapshot) => {
//     const data = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));

//     const grouped = {};
//     data.forEach(item => {
//       if (!grouped[item.category]) grouped[item.category] = [];
//       grouped[item.category].push(item);
//     });

//     callback(grouped);
//   });
// };

// services/menuService.js
// import { db } from '../firebase';
// import { 
//   collection, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   getDocs, 
//   onSnapshot,
//   query,
//   orderBy
// } from 'firebase/firestore';

// const MENU_COLLECTION = 'menu';

// // Subscribe to real-time menu updates
// export const subscribeToMenu = (callback) => {
//   const menuRef = collection(db, MENU_COLLECTION);
//   const q = query(menuRef, orderBy('createdAt', 'desc'));
  
//   return onSnapshot(q, (snapshot) => {
//     const menuItems = {
//       shawarma: [],
//       plates: [],
//       sandwiches: [],
//       sides: [],
//       drinks: []
//     };
    
//     snapshot.forEach((doc) => {
//       const item = { id: doc.id, ...doc.data() };
//       const category = item.category || 'shawarma';
      
//       // Ensure the category exists in our menu object
//       if (menuItems[category]) {
//         menuItems[category].push(item);
//       } else {
//         // If category doesn't exist, default to shawarma
//         menuItems.shawarma.push(item);
//       }
//     });
    
//     callback(menuItems);
//   }, (error) => {
//     console.error('Error fetching menu:', error);
//     callback({
//       shawarma: [],
//       plates: [],
//       sandwiches: [],
//       sides: [],
//       drinks: []
//     });
//   });
// };

// // Get all menu items (one-time fetch)
// export const getMenuItems = async () => {
//   try {
//     const menuRef = collection(db, MENU_COLLECTION);
//     const snapshot = await getDocs(menuRef);
//     const menuItems = {
//       shawarma: [],
//       plates: [],
//       sandwiches: [],
//       sides: [],
//       drinks: []
//     };
    
//     snapshot.forEach((doc) => {
//       const item = { id: doc.id, ...doc.data() };
//       const category = item.category || 'shawarma';
//       if (menuItems[category]) {
//         menuItems[category].push(item);
//       } else {
//         menuItems.shawarma.push(item);
//       }
//     });
    
//     return menuItems;
//   } catch (error) {
//     console.error('Error getting menu items:', error);
//     return {
//       shawarma: [],
//       plates: [],
//       sandwiches: [],
//       sides: [],
//       drinks: []
//     };
//   }
// };

// // Add a new menu item
// export const addMenuItem = async (itemData) => {
//   try {
//     const menuRef = collection(db, MENU_COLLECTION);
//     const newItem = {
//       ...itemData,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//       available: itemData.available !== undefined ? itemData.available : true
//     };
    
//     const docRef = await addDoc(menuRef, newItem);
//     return { id: docRef.id, ...newItem };
//   } catch (error) {
//     console.error('Error adding menu item:', error);
//     throw error;
//   }
// };

// // Update an existing menu item
// export const updateMenuItem = async (itemId, itemData) => {
//   try {
//     const itemRef = doc(db, MENU_COLLECTION, itemId);
//     const updateData = {
//       ...itemData,
//       updatedAt: new Date().toISOString()
//     };
    
//     await updateDoc(itemRef, updateData);
//     return { success: true };
//   } catch (error) {
//     console.error('Error updating menu item:', error);
//     throw error;
//   }
// };

// // Delete a menu item
// export const deleteMenuItem = async (itemId) => {
//   try {
//     const itemRef = doc(db, MENU_COLLECTION, itemId);
//     await deleteDoc(itemRef);
//     return { success: true };
//   } catch (error) {
//     console.error('Error deleting menu item:', error);
//     throw error;
//   }
// };

// // Get menu items by category
// export const getMenuItemsByCategory = async (category) => {
//   try {
//     const menuRef = collection(db, MENU_COLLECTION);
//     const snapshot = await getDocs(menuRef);
//     const items = [];
    
//     snapshot.forEach((doc) => {
//       const item = { id: doc.id, ...doc.data() };
//       if (item.category === category) {
//         items.push(item);
//       }
//     });
    
//     return items;
//   } catch (error) {
//     console.error('Error getting menu items by category:', error);
//     return [];
//   }
// };

// // Toggle item availability
// export const toggleItemAvailability = async (itemId, currentStatus) => {
//   try {
//     const itemRef = doc(db, MENU_COLLECTION, itemId);
//     await updateDoc(itemRef, {
//       available: !currentStatus,
//       updatedAt: new Date().toISOString()
//     });
//     return { success: true };
//   } catch (error) {
//     console.error('Error toggling item availability:', error);
//     throw error;
//   }
// };

// services/menuService.js
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

const MENU_COLLECTION = 'menu';

// Subscribe to real-time menu updates
export const subscribeToMenu = (callback) => {
  const menuRef = collection(db, MENU_COLLECTION);
  const q = query(menuRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const menuItems = {
      shawarma: [],
      plates: [],
      sandwiches: [],
      sides: [],
      drinks: []
    };
    
    snapshot.forEach((doc) => {
      const item = { id: doc.id, ...doc.data() };
      const category = item.category || 'shawarma';
      
      if (menuItems[category]) {
        menuItems[category].push(item);
      } else {
        menuItems.shawarma.push(item);
      }
    });
    
    callback(menuItems);
  }, (error) => {
    console.error('Error fetching menu:', error);
    callback({
      shawarma: [],
      plates: [],
      sandwiches: [],
      sides: [],
      drinks: []
    });
  });
};

// Add a new menu item with preparation time
export const addMenuItem = async (itemData) => {
  try {
    const menuRef = collection(db, MENU_COLLECTION);
    const newItem = {
      ...itemData,
      preparationTime: itemData.preparationTime || 5, // Default 5 minutes
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      available: itemData.available !== undefined ? itemData.available : true
    };
    
    const docRef = await addDoc(menuRef, newItem);
    return { id: docRef.id, ...newItem };
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
};

// Update menu item
export const updateMenuItem = async (itemId, itemData) => {
  try {
    const itemRef = doc(db, MENU_COLLECTION, itemId);
    const updateData = {
      ...itemData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(itemRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

// Delete menu item
export const deleteMenuItem = async (itemId) => {
  try {
    const itemRef = doc(db, MENU_COLLECTION, itemId);
    await deleteDoc(itemRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};