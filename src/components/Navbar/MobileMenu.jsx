import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';

export default function MobileMenu({currentView, setCurrentView, isMobileMenuOpen, toggleMobileMenu, handleLogout, darkMode, onToggleDarkMode }) {
    const { user } = useSelector(state => state.auth);
    
    return (
        <>
            <div
                className={`fixed top-0 right-0 h-full bg-gray-800 dark:bg-gray-900 text-white shadow-lg transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    } transition-transform duration-300 ease-in-out w-64 z-50`}
            >
                <div className="p-4 flex justify-between items-center">
                    <button
                        onClick={toggleMobileMenu}
                        className="text-white hover:text-gray-300 focus:outline-none"
                    >
                        X
                    </button>
                    <button
                        onClick={onToggleDarkMode}
                        className="p-2 text-gray-300 hover:text-white focus:outline-none"
                        aria-label="Toggle dark mode"
                    >
                        <FontAwesomeIcon
                            icon={darkMode ? faSun : faMoon}
                            className="w-5 h-5"
                        />
                    </button>
                </div>
                
                {/* User Profile Section */}
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <p className="font-medium text-white">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <span>Logout</span>
                    </button>
                </div>
                
                {setCurrentView && (
                    <div className="flex flex-col gap-2 p-4">
                        <h3 className="text-gray-400 text-sm font-medium mb-2">Navigation</h3>
                        <button
                            onClick={() => {
                                setCurrentView('home');
                                toggleMobileMenu();
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out text-left
                                ${currentView === 'home'
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-white hover:bg-gray-700'}`}
                        >
                            Home
                        </button>
                        <button
                            onClick={() => {
                                setCurrentView('shared');
                                toggleMobileMenu();
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out text-left
                                ${currentView === 'shared'
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-white hover:bg-gray-700'}`}
                        >
                            Shared
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
