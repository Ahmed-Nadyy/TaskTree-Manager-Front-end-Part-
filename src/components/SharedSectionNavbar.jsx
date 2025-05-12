import React from 'react';
import { Link } from 'react-router-dom';

const SharedSectionNavbar = () => {
  return (
    <nav className="bg-slate-800 dark:bg-slate-900 p-4 shadow-md sticky top-0 z-50 w-full">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white hover:text-sky-400 transition-colors">
          TaskTree
        </Link>
        <div className="space-x-4">
          <Link 
            to="/signup" 
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50"
          >
            Sign Up
          </Link>
          <Link 
            to="/login" 
            className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
          >
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default SharedSectionNavbar;