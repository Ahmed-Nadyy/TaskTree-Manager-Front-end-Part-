import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, toggleDarkMode } from '../../redux/slices/authSlice';
import NavSearch from './NavSearch';
import MobileSearch from './MobileSearch';
import MobileMenu from './MobileMenu';
import Btn from './Btn';
import { logoutUser, updateDarkMode } from '../../apiService'; 
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';

export default function Navbar({ currentView, setCurrentView }) {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dispatch = useDispatch();
    const { darkMode, user } = useSelector(state => state.auth);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleMobileSearch = () => {
        setIsMobileSearchOpen(!isMobileSearchOpen);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleDarkModeToggle = async () => {
        dispatch(toggleDarkMode());
        try {
            await updateDarkMode(!darkMode);
        } catch (error) {
            console.error('Failed to update dark mode preference:', error);
        }
        // Update document class for dark mode
        if (!darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    
    const handleLogout = async () => {
        try {
            await logoutUser(); 
            dispatch(logout()); 
            localStorage.removeItem('authToken'); 
            localStorage.removeItem('user'); 
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user || !user.name) return 'U';
        return user.name.split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase();
    };

    return (
        <>
            <nav className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <a href="/dashboard" className="self-center text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                        Task Tree
                    </a>
                    <div className="flex md:order-2 items-center gap-4">
                        <button
                            onClick={handleDarkModeToggle}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                                rounded-lg transition-colors duration-200 relative group"
                            aria-label="Toggle dark mode"
                        >
                            <FontAwesomeIcon 
                                icon={darkMode ? faSun : faMoon} 
                                className="w-5 h-5 transition-transform duration-200 hover:scale-110" 
                            />
                            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                                {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            </span>
                        </button>
                        <NavSearch 
                            toggleMobileSearch={toggleMobileSearch} 
                        />
                        {/* View Toggle Buttons - Placed before mobile menu button and logout for better desktop layout */}
                        {setCurrentView && (
                            <div className="hidden md:flex items-center space-x-1">
                                <button
                                    onClick={() => setCurrentView('home')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out 
                                                ${currentView === 'home' 
                                                    ? 'bg-blue-500 text-white shadow-sm'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    Home
                                </button>
                                <button
                                    onClick={() => setCurrentView('shared')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out 
                                                ${currentView === 'shared' 
                                                    ? 'bg-blue-500 text-white shadow-sm' 
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    Shared
                                </button>
                            </div>
                        )}

                        <button
                            onClick={toggleMobileMenu}
                            type="button"
                            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg 
                                md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 
                                dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                            aria-controls="navbar-search"
                            aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
                        >
                            <svg
                                className="w-5 h-5"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 17 14"
                            >
                                <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M1 1h15M1 7h15M1 13h15"
                                />
                            </svg>
                        </button>
                        
                        {/* User Profile Circle with Dropdown */}
                        <div className="relative hidden sm:block" ref={dropdownRef}>
                            <button 
                                onClick={toggleProfileDropdown}
                                className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                aria-expanded={isProfileDropdownOpen ? 'true' : 'false'}
                            >
                                {getUserInitials()}
                            </button>
                            
                            {/* Dropdown Menu */}
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                        <p className="font-medium">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <MobileSearch 
                        toggleMobileSearch={toggleMobileSearch}
                        isMobileSearchOpen={isMobileSearchOpen} 
                    />
                </div>
            </nav>

            <MobileMenu
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={toggleMobileMenu}
                handleLogout={handleLogout}
                darkMode={darkMode}
                onToggleDarkMode={handleDarkModeToggle}
                currentView={currentView} // Pass to MobileMenu if needed there too
                setCurrentView={setCurrentView} // Pass to MobileMenu if needed there too
            />
        </>
    );
}
