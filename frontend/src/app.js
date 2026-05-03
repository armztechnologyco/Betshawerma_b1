import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { getCurrentUser, logoutUser, updateUserActiveStatus } from './services/authService';

import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Unauthorized from './components/Auth/Unauthorized';

import CashierDashboard from './components/Cashier/CashierDashboard';
import KitchenDisplay from './components/Kitchen/KitchenDisplay';
import AccountingDashboard from './components/Accounting/AccountingDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';

import ShiftTimer from './components/Common/ShiftTimer';
import LanguageSwitcher from './components/Common/LanguageSwitcher';
import NetworkStatus from './components/Common/NetworkStatus';

function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Apply RTL direction when Arabic is active
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
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
          <div className="text-xl">{t('app.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Phase 1: Global network status banner */}
        <NetworkStatus />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* CASHIER */}
          <Route
            path="/cashier"
            element={
              <ProtectedRoute user={user} requiredPage="cashier">
                <CashierDashboard user={user} />
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
                <AdminDashboard user={user} />
              </ProtectedRoute>
            }
          />

          {/* MENU MANAGEMENT */}
          <Route
            path="/menu-management"
            element={
              <ProtectedRoute user={user} requiredPage="admin">
                <AdminDashboard user={user} initialTab="menu" />
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