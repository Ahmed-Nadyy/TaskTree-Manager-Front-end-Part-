import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setDarkMode, initializeAuth } from "./redux/slices/authSlice";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import TaskDetails from "./components/HomeComponents/TaskDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import SharedSectionPage from './pages/SharedSectionPage'; // Import the new page

export default function App() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector(state => state.auth);

  // Initialize dark mode and authentication status on app load
  useEffect(() => {
    // Initialize dark mode
    const darkModeSetting = localStorage.getItem('darkMode') === 'true';
    dispatch(setDarkMode(darkModeSetting));

    // Initialize authentication
    dispatch(initializeAuth());
  }, [dispatch]); // dispatch is stable, so this effectively runs once on mount

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <Routes>            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/task/:userId/:sectionId/:taskId" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
            <Route path="/shared/:shareToken" element={<SharedSectionPage />} /> {/* New route for publicly shared sections */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center px-4">
                {/* Optional: Add a relevant icon */}
                {/* <FontAwesomeIcon icon={faQuestionCircle} className="text-6xl text-blue-500 dark:text-blue-400 mb-6" /> */}
                <svg className="w-24 h-24 text-blue-500 dark:text-blue-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 00-9-9m9 9a9 9 0 01-9 9m9-9v.01M12 6v.01M12 18v.01M12 12h.01M12 12a3 3 0 00-3-3m3 3a3 3 0 013-3m-3 3a3 3 0 00-3 3m3-3a3 3 0 013 3"></path></svg>
                <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">404</h1>
                <p className="text-2xl text-gray-600 dark:text-gray-400 mb-8">Oops! Page Not Found.</p>
                <p className="text-md text-gray-500 dark:text-gray-500 mb-8 max-w-md">
                  The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 rounded-lg transition-colors duration-200 font-medium text-lg"
                  aria-label="Go to Home Page"
                >
                  Go to Homepage
                </button>
              </div>
            } /> {/* Catch-all route */}</Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}
