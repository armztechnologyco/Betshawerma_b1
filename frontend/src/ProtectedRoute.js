// ProtectedRoute.js
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ user, requiredPage, children }) {
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Define which pages each role can access
  const accessMap = {
    'cashier': ['cashier'],
    'chef': ['kitchen'],
    'admin': ['cashier', 'kitchen', 'accounting', 'admin']
  };

  const hasAccess = accessMap[user.role]?.includes(requiredPage);
  
  if (!hasAccess) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

export default ProtectedRoute;