import React from 'react';

export default function ViewSwitcher({ currentView, setCurrentView }) {
    return (
        <div className="hidden md:flex items-center space-x-2">
            <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
                    ${currentView === 'home' 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                aria-pressed={currentView === 'home'}
            >
                Personal
            </button>
            <button
                onClick={() => setCurrentView('shared')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
                    ${currentView === 'shared'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                aria-pressed={currentView === 'shared'}
            >
                Assigned
            </button>
        </div>
    );
}