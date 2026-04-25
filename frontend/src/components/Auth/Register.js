import React, { useState } from 'react';
import { registerUser, USER_ROLES } from '../../services/authService';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, Shield, X } from 'lucide-react';

function Register() {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.CASHIER
  });
  const [createdUsers, setCreatedUsers] = useState([]);

  const predefinedUsers = [
    {
      name: 'System Admin',
      email: 'admin@shawarma.com',
      password: 'admin123',
      role: USER_ROLES.ADMIN
    },
    {
      name: 'John Cashier',
      email: 'cashier@shawarma.com',
      password: 'cashier123',
      role: USER_ROLES.CASHIER
    },
    {
      name: 'Mike Chef',
      email: 'chef@shawarma.com',
      password: 'chef123',
      role: USER_ROLES.CHEF
    }
  ];

  const createUser = async (userData) => {
    const result = await registerUser(userData.email, userData.password, {
      name: userData.name,
      role: userData.role,
      createdBy: 'system'
    });
    
    if (result.success) {
      toast.success(`${userData.name} (${userData.role}) created successfully`);
      setCreatedUsers(prev => [...prev, { ...userData, success: true }]);
      return true;
    } else {
      if (result.error.includes('email-already-in-use')) {
        toast.error(`${userData.email} already exists`);
      } else {
        toast.error(`Failed to create ${userData.name}: ${result.error}`);
      }
      setCreatedUsers(prev => [...prev, { ...userData, success: false, error: result.error }]);
      return false;
    }
  };

  const createPredefinedUsers = async () => {
    setLoading(true);
    setCreatedUsers([]);
    
    for (const user of predefinedUsers) {
      await createUser(user);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setLoading(false);
  };

  const createSingleUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill all fields');
      return;
    }
    
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    await createUser(newUser);
    setLoading(false);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: USER_ROLES.CASHIER
    });
    setShowForm(false);
  };

  const getRoleColor = (role) => {
    switch(role) {
      case USER_ROLES.ADMIN: return 'bg-red-100 text-red-800 border-red-200';
      case USER_ROLES.CASHIER: return 'bg-green-100 text-green-800 border-green-200';
      case USER_ROLES.CHEF: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case USER_ROLES.ADMIN: return '👑';
      case USER_ROLES.CASHIER: return '💰';
      case USER_ROLES.CHEF: return '👨‍🍳';
      default: return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👥</div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Create and manage system users</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={createPredefinedUsers}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              {loading ? 'Creating...' : 'Create Predefined Users'}
            </button>
            
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={loading}
              className="bg-blue-500 text-white py-4 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              Add Custom User
            </button>
          </div>

          {/* Dynamic User Form */}
          {showForm && (
            <div className="border-2 border-blue-200 rounded-lg p-6 mb-8 bg-blue-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-900">Create Custom User</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={createSingleUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User size={16} className="inline mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock size={16} className="inline mr-1" />
                      Password (min 6 characters)
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield size={16} className="inline mr-1" />
                      User Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={USER_ROLES.ADMIN}>Admin - Full Access</option>
                      <option value={USER_ROLES.CASHIER}>Cashier - Orders Only</option>
                      <option value={USER_ROLES.CHEF}>Chef - Kitchen Only</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Predefined Users List */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Predefined Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predefinedUsers.map((user, index) => (
                <div key={index} className={`border-2 rounded-lg p-4 ${getRoleColor(user.role)}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getRoleIcon(user.role)}</span>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs opacity-75">{user.role}</p>
                    </div>
                  </div>
                  <p className="text-sm break-all">{user.email}</p>
                  <p className="text-xs mt-1">Password: {user.password}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Created Users Log */}
          {createdUsers.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">Creation Log</h2>
              <div className="space-y-2">
                {createdUsers.map((user, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      user.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email} - {user.role}</p>
                      </div>
                      <div>
                        {user.success ? (
                          <span className="text-green-600 text-sm">✓ Created</span>
                        ) : (
                          <span className="text-red-600 text-sm">✗ Failed: {user.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">📝 Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Click "Create Predefined Users" to create all three default users at once</li>
              <li>• Click "Add Custom User" to create individual users with specific roles</li>
              <li>• Users will be created in Firebase Authentication and Firestore</li>
              <li>• After creation, users can login with their email and password</li>
              <li>• You can remove this component after creating all needed users</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;