import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../../redux/slices/authSlice';
import NavSearch from './NavSearch';
import MobileSearch from './MobileSearch';
import MobileMenu from './MobileMenu';
import ViewSwitcher from './ViewSwitcher';
import { updateDarkMode } from '../../apiService'; 
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import {
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import FilterComponent from './FilterComponent';

export default function Navbar({ currentView, setCurrentView, workspaceName }) {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const dispatch = useDispatch();
    const { darkMode } = useSelector(state => state.auth);
    const [isMobile, setIsMobile] = useState(false);
    
    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleMobileSearch = () => {
        setIsMobileSearchOpen(!isMobileSearchOpen);
    };

    // const handleLogout = async () => {
    //     try {
    //         await logoutUser(); 
    //         dispatch(logout()); 
    //         localStorage.removeItem('authToken'); 
    //         localStorage.removeItem('user'); 
    //         navigate('/');
    //     } catch (error) {
    //         console.error('Logout failed:', error);
    //     }
    // };

    const handleDarkModeToggle = async () => {
        dispatch(toggleDarkMode());
        try {
            await updateDarkMode(!darkMode);
        } catch (error) {
            console.error('Error updating dark mode:', error);
        }
    };

    return (
        <nav className={`bg-white dark:bg-gray-800 shadow-md`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                    {isMobile && (
                        <button
                            className="mr-3 p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none"
                            aria-label="Toggle Sidebar"
                            onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {/* <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /> */}
                            </svg>
                        </button>
                    )}
                    <div className="flex-shrink-0">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                            {workspaceName}
                        </h1>
                    </div>
                    <div className="ml-8">
                        <ViewSwitcher currentView={currentView} setCurrentView={setCurrentView} />
                    </div>
                </div>

                    <div className="hidden md:block">
                        <NavSearch currentView={currentView} setCurrentView={setCurrentView} />
                    </div>

                    <div className="flex items-center">
                        <button
                            onClick={handleDarkModeToggle}
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none"
                        >
                            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
                        </button>
                        <div className='md:hidden'>
                        <FilterComponent />
                        </div>
                        <button
                            onClick={toggleMobileSearch}
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isMobileSearchOpen && (
                <div className="md:hidden">
                    <MobileSearch currentView={currentView} setCurrentView={setCurrentView} />
                </div>
            )}

            <MobileMenu 
                currentView={currentView} 
                setCurrentView={setCurrentView}
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={() => setIsMobileMenuOpen(false)}
                handleLogout={() => {}}
                darkMode={darkMode}
                onToggleDarkMode={handleDarkModeToggle}
            />
        </nav>
    );
}
