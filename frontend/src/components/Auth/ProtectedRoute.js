import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasAccess } from '../../services/authService';

function ProtectedRoute({ children, user, requiredPage }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!hasAccess(user.role, requiredPage)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

export default ProtectedRoute;