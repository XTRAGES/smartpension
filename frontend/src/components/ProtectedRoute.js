import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { ROLES, ROUTES } from '../constants';

/**
 * ProtectedRoute component to secure routes based on user authentication and role
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.requiredRole - Role required to access the route
 * @returns {React.ReactNode} - Rendered component or redirect
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, hasRole, role } = useUser();
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  // If a specific role is required, check if user has that role
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect based on user's actual role
    switch (role) {
      case ROLES.PENSIONER:
        return <Navigate to={ROUTES.PENSIONER_DASHBOARD} replace />;
      case ROLES.ADMIN:
        return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
      case ROLES.DOCTOR:
        return <Navigate to={ROUTES.DOCTOR_DASHBOARD} replace />;
      default:
        return <Navigate to={ROUTES.LOGIN} replace />;
    }
  }
  
  // If all checks pass, render the protected component
  return children;
};

export default ProtectedRoute; 