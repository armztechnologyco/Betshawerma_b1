import { 
  auth, 
  db 
} from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  CHEF: 'chef'
};

// Add shift time fields when registering user
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: userData.name,
      role: userData.role,
      shiftStart: userData.shiftStart || '09:00',
      shiftEnd: userData.shiftEnd || '17:00',
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy || 'system'
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          ...userData
        }
      };
    } else {
      return { success: false, error: 'User role not found' };
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    // Clear shift warning status on logout so it can show again in next login
    sessionStorage.removeItem('shiftWarningShown');
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error: error.message };
  }
};

// Get current user with role
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          resolve({
            uid: user.uid,
            email: user.email,
            ...userDoc.data()
          });
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

// Check if user has access to a page
export const hasAccess = (userRole, requiredPage) => {
  const accessMap = {
    'cashier': ['cashier'],
    'chef': ['kitchen'],
    'admin': ['cashier', 'kitchen', 'accounting', 'admin', 'overview']
  };
  
  return accessMap[userRole]?.includes(requiredPage) || false;
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Update user active status
export const updateUserActiveStatus = async (uid) => {
  if (!uid) return;
  try {
    await setDoc(doc(db, 'users', uid), { 
      lastActive: new Date().toISOString() 
    }, { merge: true });
  } catch (error) {
    console.error('Error updating active status:', error);
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, newRole) => {
  try {
    await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
};