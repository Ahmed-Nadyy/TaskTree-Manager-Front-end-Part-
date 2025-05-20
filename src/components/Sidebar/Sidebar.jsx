import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faPen,
    faTrash,
    faPlus,
    faSignOutAlt,
    faStar,
    faBars
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

import { logoutUser } from '../../apiService';

export default function Sidebar({ 
    workspaces, 
    currentWorkspace, 
    onWorkspaceChange, 
    onNewWorkspace, 
    onEditWorkspace, 
    onDeleteWorkspace,
    isCollapsed,
    setIsCollapsed
}) {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    
    // Check if device is mobile and initialize sidebar state
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = window.innerWidth < 768;
            setIsMobile(isMobileDevice);
            
            // Initialize sidebar state based on device type
            if (isMobileDevice && !isOpen) {
                // On mobile, sidebar should start closed
                setIsOpen(false);
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Handle touch events for swipe detection
    useEffect(() => {
        const handleTouchStart = (e) => {
            setTouchStartX(e.touches[0].clientX);
        };
        
        const handleTouchMove = (e) => {
            if (!isMobile) return;
            
            const touchEndX = e.touches[0].clientX;
            const diff = touchEndX - touchStartX;
            
            // Swipe from left edge to open sidebar
            if (!isOpen && touchStartX < 30 && diff > 70) {
                setIsOpen(true);
            }
            
            // Swipe left to close sidebar
            if (isOpen && diff < -70) {
                setIsOpen(false);
            }
        };
        
        // Close sidebar when clicking outside
        const handleClickOutside = (e) => {
            if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        
        // Toggle sidebar from navbar button
    const handleToggleSidebar = () => {
        if (isMobile) {
            setIsOpen(prev => !prev);
            console.log('Toggle sidebar event received, new state:', !isOpen);
        }
    };
        
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('toggle-sidebar', handleToggleSidebar);
        
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('toggle-sidebar', handleToggleSidebar);
        };
    }, [isMobile, isOpen, touchStartX]);

    const handleLogout = async () => {
        try {
            await logoutUser();
            dispatch(logout());
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleNewWorkspace = () => {
        Swal.fire({
            title: 'Create New Workspace',
            input: 'text',
            inputLabel: 'Workspace Name',
            inputPlaceholder: 'Enter workspace name',
            showCancelButton: true,
            confirmButtonText: 'Create',
            background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter a workspace name!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                onNewWorkspace(result.value);
            }
        });
    };

    const handleEditWorkspace = (workspace) => {
        Swal.fire({
            title: 'Edit Workspace',
            input: 'text',
            inputLabel: 'Workspace Name',
            inputValue: workspace.name,
            showCancelButton: true,
            confirmButtonText: 'Save',
            background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter a workspace name!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                onEditWorkspace(workspace._id, result.value);
            }
        });
    };

    const handleDeleteWorkspace = (workspace) => {
        Swal.fire({
            title: 'Delete Workspace',
            text: 'Are you sure you want to delete this workspace? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
        }).then((result) => {
            if (result.isConfirmed) {
                onDeleteWorkspace(workspace._id);
            }
        });
    };

    // Add sidebar toggle button for mobile
    const SidebarToggleButton = () => {
        if (!isMobile) return null;
        
        return (
            <button 
                className="fixed top-4 left-4 z-50 p-2 rounded-full bg-sky-500 text-white shadow-lg"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Sidebar"
            >
                <FontAwesomeIcon icon={isOpen ? faChevronLeft : faChevronRight} />
            </button>
        );
    };
    
    // Add CSS for mobile sidebar
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }
            
            .mobile-sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 40;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            .mobile-sidebar-overlay.open {
                opacity: 1;
                visibility: visible;
            }
            
            .mobile-sidebar {
                position: fixed;
                top: 0;
                left: 0;
                height: 100%;
                z-index: 50;
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .mobile-sidebar.open {
                transform: translateX(0);
                animation: slideInLeft 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        
        return () => document.head.removeChild(style);
    }, []);
    
    return (
        <>
            <SidebarToggleButton />
            {isMobile && <div className={`mobile-sidebar-overlay ${isOpen ? 'open' : ''}`} />}
            <div 
                ref={sidebarRef}
                className={`${isMobile ? 'mobile-sidebar' : 'relative'} transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-16' : 'w-64'} 
                    ${isMobile && isOpen ? 'open' : ''}
                    h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
            >
            <div className={`flex flex-col h-full ${isCollapsed ? 'px-2' : 'px-4'}`}>
                {/* Header with system name and collapse button */}
                <div className="flex items-center justify-between h-16">
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                            TaskTree
                        </h1>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
                            ${isCollapsed ? 'w-full flex justify-center' : ''}`}
                    >
                        <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
                    </button>
                </div>

                {/* Workspaces list */}
                <div className="flex-1 overflow-y-auto mt-4">
                    {!isCollapsed && (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                    WORKSPACES
                                </h2>
                                <button
                                    onClick={handleNewWorkspace}
                                    className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {workspaces.map((workspace) => (
                                    <div
                                        key={workspace._id}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer
                                            ${workspace._id === currentWorkspace?._id 
                                                ? 'bg-gray-200 dark:bg-gray-700' 
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                        onClick={() => onWorkspaceChange(workspace)}
                                    >
                                        <div className="flex items-center space-x-2 min-w-0">
                                            {workspace.isDefault && (
                                                <FontAwesomeIcon 
                                                    icon={faStar} 
                                                    className="text-yellow-500 flex-shrink-0"
                                                />
                                            )}
                                            <span className="text-gray-800 dark:text-white truncate flex-1">
                                                {workspace.name}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            {!workspace.isDefault && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditWorkspace(workspace);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteWorkspace(workspace);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {isCollapsed && (
                        <div className="flex flex-col items-center space-y-2">
                            {workspaces.map((workspace) => (
                                <button
                                    key={workspace._id}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center
                                        ${workspace._id === currentWorkspace?._id 
                                            ? 'bg-gray-200 dark:bg-gray-700' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    onClick={() => onWorkspaceChange(workspace)}
                                    title={workspace.name}
                                >
                                    {workspace.isDefault ? (
                                        <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                                    ) : (
                                        <span className="font-bold text-gray-600 dark:text-gray-300">
                                            {workspace.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </button>
                            ))}
                            <button
                                onClick={handleNewWorkspace}
                                className="w-10 h-10 rounded-lg flex items-center justify-center
                                    hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Create New Workspace"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-gray-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* User section */}
                {!isCollapsed && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 mt-auto">
                        <div className="flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} />
                            </button>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="p-2 mt-auto">
                        <button
                            onClick={handleLogout}
                            className="w-full p-2 rounded-lg text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400
                                flex items-center justify-center"
                            title="Logout"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
