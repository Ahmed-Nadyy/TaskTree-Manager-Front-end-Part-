import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSection, setStatus, setPriority, setDueDateRange, setTags, clearFilters } from '../../redux/slices/filterSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faCalendarAlt, faFlag, faCheckCircle, faLayerGroup, faTag, faTimes } from '@fortawesome/free-solid-svg-icons';
import { notification } from 'antd';

export default function FilterComponent() {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useDispatch();
    const filterState = useSelector(state => state.filter);
    const dropdownRef = useRef(null);
    const [sections, setSections] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Get sections from the Home component state
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
                if (userId) {
                    const token = localStorage.getItem('authToken');
                    const response = await fetch(`http://localhost:5000/api/sections/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await response.json();
                    // Only show sections owned by the current user
                    setSections(data.filter(section => section.userId === userId));
                }
            } catch (error) {
                console.error("Error fetching sections:", error);
            }
        };
        
        fetchSections();
    }, []);
    
    // Count active filters
    useEffect(() => {
        let count = 0;
        if (filterState.section) count++;
        if (filterState.status) count++;
        if (filterState.priority) count++;
        if (filterState.dueDateRange.startDate || filterState.dueDateRange.endDate) count++;
        if (filterState.tags.length > 0) count++;
        setActiveFiltersCount(count);
    }, [filterState]);
    
    const handleSectionChange = (e) => {
        dispatch(setSection(e.target.value));
    };
    
    const handleStatusChange = (e) => {
        dispatch(setStatus(e.target.value));
    };
    
    const handlePriorityChange = (e) => {
        dispatch(setPriority(e.target.value));
    };
    
    const handleStartDateChange = (e) => {
        dispatch(setDueDateRange({
            ...filterState.dueDateRange,
            startDate: e.target.value
        }));
    };
    
    const handleEndDateChange = (e) => {
        dispatch(setDueDateRange({
            ...filterState.dueDateRange,
            endDate: e.target.value
        }));
    };
    
    const handleTagInputChange = (e) => {
        setTagInput(e.target.value);
    };
    
    const handleTagInputKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            addTag(tagInput.trim());
        }
    };
    
    const addTag = (tag) => {
        if (tag && !filterState.tags.includes(tag)) {
            dispatch(setTags([...filterState.tags, tag]));
            setTagInput('');
        }
    };
    
    const removeTag = (tagToRemove) => {
        dispatch(setTags(filterState.tags.filter(tag => tag !== tagToRemove)));
    };
    
    const handleClearFilters = () => {
        dispatch(clearFilters());
        notification.success({
            message: 'Filters Cleared',
            description: 'All filters have been reset',
        });
    };
    
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };
    
    const handleApplyFilters = () => {
        setIsOpen(false);
        if (activeFiltersCount > 0) {
            notification.success({
                message: 'Filters Applied',
                description: `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied successfully`,
            });
        }
    };
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                    rounded-lg transition-colors duration-200 flex items-center gap-1 relative"
                aria-label="Filter tasks"
            >
                <FontAwesomeIcon 
                    icon={faFilter} 
                    className={`w-5 h-5 transition-transform duration-200 hover:scale-110 ${activeFiltersCount > 0 ? 'text-blue-600 dark:text-blue-500 font-bold' : ''}`} 
                />
                <span className={`text-sm hidden sm:inline ${activeFiltersCount > 0 ? 'font-semibold' : ''}`}>Filter</span>
                {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" aria-live="polite">
                        {activeFiltersCount}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 p-4 border border-gray-200 dark:border-gray-700 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                        <button 
                            onClick={handleClearFilters}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Clear all
                        </button>
                    </div>
                    
                    {/* Section Filter */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FontAwesomeIcon icon={faLayerGroup} />
                            Section
                        </label>
                        <select 
                            value={filterState.section}
                            onChange={handleSectionChange}
                            className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500
                                dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">All Sections</option>
                            {sections.map(section => (
                                <option key={section._id} value={section._id}>{section.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Status
                        </label>
                        <select 
                            value={filterState.status}
                            onChange={handleStatusChange}
                            className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500
                                dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">All Tasks</option>
                            <option value="completed">Completed</option>
                            <option value="incomplete">Incomplete</option>
                        </select>
                    </div>
                    
                    {/* Priority Filter */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FontAwesomeIcon icon={faFlag} />
                            Priority
                        </label>
                        <select 
                            value={filterState.priority}
                            onChange={handlePriorityChange}
                            className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500
                                dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    
                    {/* Due Date Range Filter */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            Due Date Range
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={filterState.dueDateRange.startDate || ''}
                                onChange={handleStartDateChange}
                                className="w-1/2 p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500
                                    dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="From"
                            />
                            <input 
                                type="date" 
                                value={filterState.dueDateRange.endDate || ''}
                                onChange={handleEndDateChange}
                                className="w-1/2 p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500
                                    dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="To"
                            />
                        </div>
                    </div>
                    
                    {/* Tags Filter */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FontAwesomeIcon icon={faTag} />
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {filterState.tags.map((tag, index) => (
                                <span 
                                    key={index} 
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 border border-blue-200"
                                >
                                    {tag}
                                    <button 
                                        onClick={() => removeTag(tag)}
                                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="relative flex items-center">
                            <input 
                                type="text" 
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleTagInputKeyDown}
                                className="flex-1 p-2 text-sm border rounded-l-md focus:ring-2 focus:ring-blue-500
                                    dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-8"
                                placeholder="Add a tag..."
                            />
                            {tagInput && (
                                <button 
                                    type="button"
                                    onClick={() => setTagInput('')}
                                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    aria-label="Clear tag input"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="w-3 h-3"/>
                                </button>
                            )}
                            <button
                                onClick={() => addTag(tagInput.trim())}
                                disabled={!tagInput.trim()}
                                className="bg-blue-500 text-white px-3 py-2 rounded-r-md hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-4 flex gap-2">
                        <button 
                            onClick={handleClearFilters}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md
                                transition-colors duration-200 text-sm font-medium"
                        >
                            Reset
                        </button>
                        <button 
                            onClick={handleApplyFilters}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md
                                transition-colors duration-200 text-sm font-medium"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}