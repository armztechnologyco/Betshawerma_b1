// services/imageService.js
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

// Upload image to Firebase Storage
export const uploadMenuItemImage = async (itemId, imageFile) => {
  try {
    const imageRef = ref(storage, `menu-items/${itemId}/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(imageRef);
    return { success: true, url: downloadURL, path: imageRef.fullPath };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
};

// Delete image from storage
export const deleteMenuItemImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
};

// Update menu item with image URL
export const updateMenuItemImage = async (itemId, imageUrl) => {
  try {
    const menuRef = doc(db, 'menu', itemId);
    await updateDoc(menuRef, { imageUrl });
    return { success: true };
  } catch (error) {
    console.error('Error updating menu item image:', error);
    return { success: false, error: error.message };
  }
};