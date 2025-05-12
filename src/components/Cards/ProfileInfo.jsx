import React from 'react'
import SearchBar from '../SearchBar/SearchBar'
import { useNavigate } from 'react-router-dom'
export default function ProfileInfo() {
    const navigate = useNavigate();
    // Dummy user data, replace with actual data from context or props
    const user = { initials: 'AN', fullName: 'Ahmed Nady' }; 

    return (
        <div className="flex items-center justify-between w-full">
            <div>
                <h1 className='text-3xl font-bold text-primary dark:text-primary-dark'>Ted Sys</h1>
            </div>

            <div className="flex-grow max-w-xl mx-4">
                <SearchBar />
            </div>
            
            <div className='flex items-center gap-3'>
                <div 
                    className='w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-700 flex items-center justify-center border-2 border-indigo-300 dark:border-indigo-600'
                    title={user.fullName} // Tooltip for full name
                >
                    <span className='text-sm font-bold text-indigo-700 dark:text-indigo-200'>{user.initials}</span>
                </div>
                <button 
                    onClick={() => navigate('/login')}
                    className='bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-white px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium'
                    aria-label="Logout"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
