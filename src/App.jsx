import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setDarkMode } from "./redux/slices/authSlice";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import TaskDetails from "./components/HomeComponents/TaskDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector(state => state.auth);

  // Initialize dark mode from localStorage on app load
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    dispatch(setDarkMode(darkMode));
  }, []); // Only run once on mount

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <Routes>            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/task/:userId/:sectionId/:taskId" element={<TaskDetails />} />
            <Route path="/shared/:token" element={<Home />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page Not Found</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Go Home
                </button>
              </div>
            } /> {/* Catch-all route */}</Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}
