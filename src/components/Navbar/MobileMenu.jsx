import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import Btn from './Btn'

export default function MobileMenu({currentView,setCurrentView, isMobileMenuOpen, toggleMobileMenu, handleLogout, darkMode, onToggleDarkMode }) {
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
                <div className="p-4 space-y-4">
                    <div onClick={handleLogout}>
                        <Btn title="Logout" />
                    </div>
                </div>
                {setCurrentView && (
                    <div className="flex items-center gap-2 px-8">
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
            </div>
        </>
    )
}
