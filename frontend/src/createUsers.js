import { registerUser } from './services/authService';

// Run this in browser console to create users
const createUsers = async () => {
  // Create Admin
  await registerUser('admin@shawarma.com', 'admin123', {
    name: 'System Admin',
    role: 'admin',
    createdBy: 'system'
  });
  
  // Create Cashier
  await registerUser('cashier@shawarma.com', 'cashier123', {
    name: 'John Cashier',
    role: 'cashier',
    createdBy: 'system'
  });
  
  // Create Chef
  await registerUser('chef@shawarma.com', 'chef123', {
    name: 'Mike Chef',
    role: 'chef',
    createdBy: 'system'
  });
  
  console.log('Users created successfully!');
};

createUsers();