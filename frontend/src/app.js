import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { getCurrentUser, logoutUser, updateUserActiveStatus } from './services/authService';

import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Unauthorized from './components/Auth/Unauthorized';

import CashierDashboard from './components/Cashier/CashierDashboard';
import KitchenDisplay from './components/Kitchen/KitchenDisplay';
import AccountingDashboard from './components/Accounting/AccountingDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';

import ShiftTimer from './components/Common/ShiftTimer';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkUser = async () => {
    if (!navigator.onLine) {
      const cached = localStorage.getItem('cachedUser');
      if (cached) {
        setUser(JSON.parse(cached));
      }
      setLoading(false);
      return;
    }
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      // Cache user for offline recovery
      localStorage.setItem('cachedUser', JSON.stringify(currentUser));
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  // Heartbeat to keep user "Online"
  useEffect(() => {
    if (user) {
      updateUserActiveStatus(user.uid);
      const interval = setInterval(() => {
        updateUserActiveStatus(user.uid);
      }, 60000); // Every 60 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!loading && isOffline && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-bold text-red-600 mb-4">⚠️ Offline Mode</div>
        <div className="text-center max-w-md">
          The application is running offline. You can still view cached menus and continue working, but some features (like login or real‑time updates) are unavailable until you reconnect.
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* 🔥 GLOBAL TOP BAR (only when logged in) */}
        {user && (
          <div className="bg-orange-600 text-white px-6 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <ShiftTimer />
              <span className="text-white">Welcome, {user?.name}</span>
              {/* <button onClick={handleLogout} className="bg-orange-700 text-white px-4 py-2 rounded-lg">
    Logout
  </button> */}
            </div>

            <button
              onClick={handleLogout}
              className="bg-orange-700 px-4 py-2 rounded hover:bg-orange-800"
            >
              Logout
            </button>
          </div>
        )}



        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/"
            element={
              <Navigate
                to={
                  user
                    ? user.role === 'cashier'
                      ? '/cashier'
                      : user.role === 'chef'
                        ? '/kitchen'
                        : user.role === 'admin'
                          ? '/admin'
                          : '/login'
                    : '/login'
                }
              />
            }
          />
          {/* CASHIER */}
          <Route
            path="/cashier"
            element={
              <ProtectedRoute user={user} requiredPage="cashier">
                <CashierDashboard userRole={user?.role} />
              </ProtectedRoute>
            }
          />

          {/* KITCHEN */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute user={user} requiredPage="kitchen">
                <KitchenDisplay />
              </ProtectedRoute>
            }
          />

          {/* ACCOUNTING */}
          <Route
            path="/accounting"
            element={
              <ProtectedRoute user={user} requiredPage="accounting">
                <AccountingDashboard />
              </ProtectedRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} requiredPage="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* MENU MANAGEMENT */}
          <Route
            path="/menu-management"
            element={
              <ProtectedRoute user={user} requiredPage="admin">
                <AdminDashboard initialTab="menu" />
              </ProtectedRoute>
            }
          />

          {/* ROOT REDIRECT */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  user
                    ? user.role === 'cashier'
                      ? '/cashier'
                      : user.role === 'chef'
                        ? '/kitchen'
                        : user.role === 'admin'
                          ? '/admin'
                          : '/login'
                    : '/login'
                }
              />
            }
          />
        </Routes>

        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;