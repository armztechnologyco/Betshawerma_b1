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
  orderBy,
  setDoc
} from 'firebase/firestore';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const MENU_COLLECTION = 'menu';
const CATEGORIES_COLLECTION = 'menu_categories';
const OPTIONS_COLLECTION = 'menu_options';

// Subscribe to real-time options (preferences)
export const subscribeToOptions = (callback) => {
  const optionsRef = collection(db, OPTIONS_COLLECTION);
  const q = query(optionsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const options = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(options);
  }, (error) => {
    console.error('Error fetching options:', error);
    callback([]);
  });
};

export const addOption = async (optionData) => {
  try {
    const { id, ...data } = optionData;
    const createdAt = new Date().toISOString();
    
    if (id) {
      const optionRef = doc(db, OPTIONS_COLLECTION, id);
      await setDoc(optionRef, { ...data, createdAt });
      return { id, ...data, createdAt };
    } else {
      const optionsRef = collection(db, OPTIONS_COLLECTION);
      const docRef = await addDoc(optionsRef, { ...data, createdAt });
      return { id: docRef.id, ...data, createdAt };
    }
  } catch (error) {
    console.error('Error adding option:', error);
    throw error;
  }
};

export const updateOption = async (optionId, optionData) => {
  try {
    const optionRef = doc(db, OPTIONS_COLLECTION, optionId);
    await updateDoc(optionRef, { ...optionData, updatedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.error('Error updating option:', error);
    throw error;
  }
};

export const deleteOption = async (optionId) => {
  try {
    const optionRef = doc(db, OPTIONS_COLLECTION, optionId);
    await deleteDoc(optionRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting option:', error);
    throw error;
  }
};

// Subscribe to real-time menu categories
export const subscribeToCategories = (callback) => {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const q = query(categoriesRef, orderBy('order', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(categories);
  }, (error) => {
    console.error('Error fetching categories:', error);
    callback([]);
  });
};

export const addCategory = async (categoryData) => {
  try {
    const { id, ...data } = categoryData;
    const createdAt = new Date().toISOString();

    if (id) {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
      await setDoc(categoryRef, { ...data, createdAt });
      return { id, ...data, createdAt };
    } else {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const docRef = await addDoc(categoriesRef, { ...data, createdAt });
      return { id: docRef.id, ...data, createdAt };
    }
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(categoryRef, { ...categoryData, updatedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(categoryRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Subscribe to real-time menu updates
export const subscribeToMenu = (callback) => {
  const menuRef = collection(db, MENU_COLLECTION);
  const q = query(menuRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const menuItems = {};

    snapshot.forEach((doc) => {
      const item = { ...doc.data(), id: doc.id };
      const category = item.category || 'uncategorized';

      if (!menuItems[category]) {
        menuItems[category] = [];
      }
      menuItems[category].push(item);
    });

    callback(menuItems);
  }, (error) => {
    console.error('Error fetching menu:', error);
    callback({});
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

/**
 * Uploads a file to Firebase Storage and returns the public URL and path.
 * Used to replace slow Base64 strings.
 */
export const uploadImage = async (id, file) => {
  if (!file) return null;
  try {
    const fileExtension = file.name.split('.').pop();
    const imageRef = ref(storage, `menu/${id}_${Date.now()}.${fileExtension}`);
    
    // Set metadata to help with caching
    const metadata = {
      cacheControl: 'public,max-age=31536000',
    };

    await uploadBytes(imageRef, file, metadata);
    const url = await getDownloadURL(imageRef);

    return { success: true, url, path: imageRef.fullPath };
  } catch (err) {
    console.error('Storage Upload Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Deletes an image from Storage to keep the bucket clean.
 */
export const deleteImage = async (path) => {
  if (!path || path === '🍽️') return;
  try {
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
    return { success: true };
  } catch (err) {
    console.error('Storage Delete Error:', err);
    return { success: false };
  }
};