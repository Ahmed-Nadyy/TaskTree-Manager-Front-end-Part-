import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, toggleDarkMode } from '../../redux/slices/authSlice';
import NavSearch from './NavSearch';
import MobileSearch from './MobileSearch';
import MobileMenu from './MobileMenu';
import Btn from './Btn';
import { logoutUser, updateDarkMode } from '../../apiService'; 
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

export default function Navbar() {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const dispatch = useDispatch();
    const { darkMode } = useSelector(state => state.auth);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleMobileSearch = () => {
        setIsMobileSearchOpen(!isMobileSearchOpen);
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
        console.log('Logout button clicked'); 
        try {
            await logoutUser(); 
            dispatch(logout()); 
            localStorage.removeItem('authToken'); 
            localStorage.removeItem('user'); 
            navigate('/login');
        } catch (error) {
            console.log('Logout failed:', error);
        }
    };

    return (
        <>
            <nav className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <span className="self-center text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                        Task Tree
                    </span>
                    <div className="flex md:order-2 items-center gap-4">
                        <button
                            onClick={handleDarkModeToggle}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                                rounded-lg transition-colors duration-200"
                            aria-label="Toggle dark mode"
                        >
                            <FontAwesomeIcon 
                                icon={darkMode ? faSun : faMoon} 
                                className="w-5 h-5 transition-transform duration-200 hover:scale-110" 
                            />
                        </button>
                        <NavSearch 
                            toggleMobileSearch={toggleMobileSearch} 
                        />
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
                        <div className="hidden sm:block">
                            <Btn title="Logout" onClick={handleLogout} />
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
            />
        </>
    );
}
