import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { setSearchTerm, clearSearchTerm } from '../../redux/slices/filterSlice';
import FilterComponent from './FilterComponent';

export default function NavSearch({toggleMobileSearch}) {
    const dispatch = useDispatch();
    const { searchTerm } = useSelector(state => state.filter);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    
    // Initialize local state from Redux
    useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);
    
    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalSearchTerm(value);
        dispatch(setSearchTerm(value));
    };
    
    // Clear search term
    const handleClearSearch = () => {
        setLocalSearchTerm('');
        dispatch(clearSearchTerm());
    };
    
    return (
        <div className="flex items-center gap-2">
            <button onClick={toggleMobileSearch} type="button" data-collapse-toggle="navbar-search" aria-controls="navbar-search" aria-expanded="false" className="md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 me-1">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                </svg>
                <span className="sr-only">Search</span>
            </button>
            <div className="relative hidden md:block">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                    </svg>
                    <span className="sr-only">Search icon</span>
                </div>
                <input 
                    type="text" 
                    id="search-navbar" 
                    value={localSearchTerm}
                    onChange={handleSearchChange}
                    className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    placeholder="Search tasks or tags..." 
                />
                {localSearchTerm && (
                    <button 
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            
            {/* Filter Component */}
            <FilterComponent />
        </div>
    )
}
