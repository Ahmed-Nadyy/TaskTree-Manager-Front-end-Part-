import React from "react";
import { Route, Navigate } from "react-router-dom"; // Use Navigate instead of Redirect
import { useSelector } from "react-redux"; // Assuming you're using Redux for authentication

const ProtectedRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useSelector((state) => state.auth); // Get the authentication state from Redux

  return (
    <Route
      {...rest}
      element={isAuthenticated ? element : <Navigate to="/login" />} // Use Navigate here
    />
  );
};

export default ProtectedRoute;
