import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faSignOutAlt, faUser, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchTerm, clearSearchTerm } from '../../redux/slices/filterSlice';
import FilterComponent from './FilterComponent';

export default function MobileMenu({currentView, setCurrentView, isMobileMenuOpen, toggleMobileMenu, handleLogout, darkMode, onToggleDarkMode }) {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const { searchTerm } = useSelector(state => state.filter);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    
    useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);
    
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalSearchTerm(value);
        dispatch(setSearchTerm(value));
    };
    
    const handleClearSearch = () => {
        setLocalSearchTerm('');
        dispatch(clearSearchTerm());
    };
    
    return (
        <>
            <div
                className={`fixed top-0 right-0 h-full bg-gray-800 dark:bg-gray-900 text-white shadow-lg transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    } transition-transform duration-300 ease-in-out w-64 z-50 flex flex-col`}
            >
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={toggleMobileMenu}
                            className="text-white hover:text-gray-300 focus:outline-none"
                            aria-label="Close menu"
                        >
                            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
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
                    
                    <div className="mb-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={localSearchTerm}
                                onChange={handleSearchChange}
                                className="block w-full p-2 ps-10 text-sm text-white border border-gray-600 rounded-lg bg-gray-700 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Search tasks or tags..." 
                            />
                            {localSearchTerm && (
                                <button 
                                    onClick={handleClearSearch}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    
                </div>
                
                {setCurrentView && (
                    <div className="flex flex-col gap-2 p-4 border-b border-gray-700">
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

                {/* User Profile Section - Moved to bottom */}
                <div className="mt-auto p-4 border-t border-gray-700">
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
                
               
            </div>
        </>
    )
}
