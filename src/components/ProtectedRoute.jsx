import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, status } = useSelector((state) => state.auth);

  // Show loading indicator while checking authentication status
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500 dark:text-blue-400 text-4xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return children; // User authenticated, render the protected component
};

export default ProtectedRoute;
