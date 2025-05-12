import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getSections, addSection, addTask, deleteSection, updateTask, deleteTask, markTaskAsDone, shareSection } from '../../apiService';
import { setSection } from '../../redux/slices/filterSlice';
import ProtectedRoute from '../../components/ProtectedRoute.jsx';
import TaskCard from '../../components/HomeComponents/TaskCard.jsx';
import Navbar from '../../components/Navbar/Navbar.jsx';
import { notification } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';

// Add custom animation styles
const animationStyles = `
  @keyframes pulse-slow {
    0% { box-shadow: 0 0 0 0 rgba(17, 24, 39, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(17, 24, 39, 0); }
    100% { box-shadow: 0 0 0 0 rgba(17, 24, 39, 0); }
  }
  .animate-pulse-slow {
    animation: pulse-slow 2s infinite;
  }
`;


export default function Home() {
    const [sections, setSections] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalSectionOpen, setIsModalSectionOpen] = useState(false);
    const [sectionClicked, setSectionClicked] = useState(null);
    const [newSec, setNewSec] = useState({ name: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSections, setIsLoadingSections] = useState(true); // Added for initial load
    const [processingIds, setProcessingIds] = useState([]); // To track IDs of items being processed
    const [newTask, setNewTask] = useState({
        name: "",
        description: "",
        priority: "low",
        isImportant: false,
        dueDate: "",
        tags: [],
        isDone: false,
        assignedTo: []
    });
    const [emailInput, setEmailInput] = useState('');
    const [assignedEmails, setAssignedEmails] = useState([]);

    // Add animation styles to document head
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = animationStyles;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);
    const { isAuthenticated, user, token } = useSelector((state) => state.auth);
    const userRole = user?.role || 'solo';
    const filterState = useSelector((state) => state.filter);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Filter tasks based on filter criteria
    const filterTasks = (tasks, sectionId) => {
        if (!tasks) return [];

        return tasks.filter(task => {
            // Filter by section
            if (filterState.section && filterState.section !== sectionId) {
                return false;
            }

            // Filter by status
            if (filterState.status === 'completed' && !task.isDone) {
                return false;
            }
            if (filterState.status === 'incomplete' && task.isDone) {
                return false;
            }

            // Filter by priority
            if (filterState.priority && task.priority !== filterState.priority) {
                return false;
            }

            // Filter by due date range
            if (filterState.dueDateRange.startDate && task.dueDate) {
                const taskDate = new Date(task.dueDate);
                const startDate = new Date(filterState.dueDateRange.startDate);
                if (taskDate < startDate) {
                    return false;
                }
            }

            if (filterState.dueDateRange.endDate && task.dueDate) {
                const taskDate = new Date(task.dueDate);
                const endDate = new Date(filterState.dueDateRange.endDate);
                endDate.setHours(23, 59, 59, 999); // End of the day
                if (taskDate > endDate) {
                    return false;
                }
            }

            // Filter by search term (search in task name and tags)
            if (filterState.searchTerm) {
                const searchLower = filterState.searchTerm.toLowerCase();
                const nameMatch = task.name.toLowerCase().includes(searchLower);
                const tagMatch = task.tags && task.tags.some(tag =>
                    tag.toLowerCase().includes(searchLower)
                );

                if (!nameMatch && !tagMatch) {
                    return false;
                }
            }

            return true;
        });
    };

    // Update sections in FilterComponent when they change
    useEffect(() => {
        if (sections.length > 0) {
            // This would ideally update a global state that FilterComponent can access
            // For now, we'll just make sure the section filter works correctly
            const sectionExists = sections.some(section => section._id === filterState.section);
            if (filterState.section && !sectionExists) {
                dispatch(setSection(''));
            }
        }
    }, [sections, filterState.section, dispatch]);

    const notifySuccess = (message) => {
        notification.success({
            message: 'Success',
            description: message,
        });
    };

    const notifyError = (message) => {
        notification.error({
            message: 'Error',
            description: message,
        });
    };

    useEffect(() => {
        // console.log(isAuthenticated, user);
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        const fetchSections = async () => {
            setIsLoadingSections(true);
            try {
                if (!user?.id) {
                    console.log("User ID not available for fetching sections", user);
                    notifyError("User session error. Please try logging in again.");
                    setIsLoadingSections(false);
                    return;
                }
                const sectionsData = await getSections(user.id, token);
                setSections(sectionsData);
            } catch (error) {
                // console.error("Error fetching sections:", error);
                // notifyError(error.message || 'Failed to load sections. Please try again.');
            } finally {
                setIsLoadingSections(false);
            }
        };

        if (isAuthenticated && user?.id) {
            fetchSections();
        }

    }, [isAuthenticated, user, token, navigate]); // Added token and navigate to dependency array

    const handleTaskIsDone = async (taskId, sectionId, isChecked) => {
        // Store the original sections state for rollback
        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, taskId]); // Add task ID to processing list
        try {
            // Optimistic update
            setSections(prevSections => prevSections.map(section =>
                section._id === sectionId
                    ? {
                        ...section,
                        tasks: section.tasks.map(task =>
                            task._id === taskId ? { ...task, isDone: isChecked } : task
                        ),
                    }
                    : section
            ));

            const updatedTask = await markTaskAsDone(sectionId, taskId, isChecked);
            console.log(`Task marked as ${isChecked ? 'done' : 'undone'}:`, updatedTask);
            notifySuccess(`Task marked as ${isChecked ? 'complete' : 'incomplete'}`);
        } catch (error) {
            // Revert to original state on error
            setSections(originalSections);
            notifyError('Failed to update task status');
            console.error('Error updating task status:', error);
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== taskId)); // Remove task ID
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Are you sure you want to delete this section and all its tasks?')) return;

        // Store original state for rollback
        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, sectionId]); // Add section ID
        try {
            // Optimistic delete
            setSections(prevSections => prevSections.filter(section => section._id !== sectionId));
            await deleteSection(sectionId);
            notifySuccess('Section deleted successfully');
        } catch (error) {
            // Restore original state on error
            setSections(originalSections);
            notifyError('Failed to delete section');
            console.error('Error deleting section:', error);
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== sectionId)); // Remove section ID
        }
    };

    const handleCreateSection = async () => {
        if (!newSec.name.trim()) return;

        setIsSubmitting(true);
        const tempId = Date.now().toString();
        try {
            // Optimistic create
            const tempSection = {
                _id: tempId,
                name: newSec.name,
                tasks: [],
                userId: user.id
            };
            setSections(prev => [...prev, tempSection]);
            setNewSec({ name: '' });
            setIsModalSectionOpen(false);

            const createdSection = await addSection({ userId: user.id, name: newSec.name });
            // Update with real section data
            setSections(prev => prev.map(section =>
                section._id === tempId ? createdSection : section
            ));
            notifySuccess('Section created successfully');
        } catch (error) {
            // Remove temporary section on error
            setSections(prev => prev.filter(section => section._id !== tempId));
            notifyError('Failed to create section');
            console.error('Error creating section:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateTask = async (sectionId) => {
        if (!newTask.name?.trim()) return;

        setIsSubmitting(true);
        const tempId = Date.now().toString();

        // Format task data with assignments
        const taskData = {
            ...newTask,
            assignedTo: assignedEmails.map(email => ({ email }))
        };

        try {
            // Optimistic create
            const tempTask = {
                _id: tempId,
                ...taskData,
                isDone: false,
                subtaskCount: 0,
                subtaskCompleted: 0
            };

            setSections(prev => prev.map(section =>
                section._id === sectionId
                    ? { ...section, tasks: [...section.tasks, tempTask] }
                    : section
            ));

            // Reset form
            setNewTask({
                name: '',
                description: '',
                priority: 'low',
                isImportant: false,
                dueDate: '',
                tags: [],
                assignedTo: []
            });
            setEmailInput('');
            setAssignedEmails([]);
            setIsModalOpen(false);

            // Send to server and update with real data
            const response = await addTask(sectionId, taskData);
            setSections(prev => prev.map(section =>
                section._id === sectionId
                    ? {
                        ...section,
                        tasks: section.tasks.map(task =>
                            task._id === tempId ? response.task : task
                        )
                    }
                    : section
            ));
            notifySuccess('Task created successfully');
        } catch (error) {
            // Remove temporary task on error
            setSections(prev => prev.map(section =>
                section._id === sectionId
                    ? { ...section, tasks: section.tasks.filter(task => task._id !== tempId) }
                    : section
            ));
            notifyError('Failed to create task');
            console.error('Error creating task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTask = async (taskId, sectionId, updatedData) => {
        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, taskId]); // Add task ID
        try {
            // Optimistic update
            setSections(prevSections =>
                prevSections.map(section =>
                    section._id === sectionId
                        ? {
                            ...section,
                            tasks: section.tasks.map(task =>
                                task._id === taskId
                                    ? { ...task, ...updatedData }
                                    : task
                            )
                        }
                        : section
                )
            );

            const response = await updateTask(sectionId, taskId, updatedData);
            notifySuccess('Task updated successfully');
        } catch (error) {
            // Revert to original state on error
            setSections(originalSections);
            notifyError('Failed to update task');
            console.error('Error updating task:', error);
            throw error; // Re-throw to handle in the component
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== taskId)); // Remove task ID
        }
    };

    const handleDeleteTask = async (taskId, sectionId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, taskId]); // Add task ID
        try {
            // Optimistic delete
            setSections(sections =>
                sections.map(section =>
                    section._id === sectionId
                        ? {
                            ...section,
                            tasks: section.tasks.filter(task => task._id !== taskId),
                        }
                        : section
                )
            );

            await deleteTask(sectionId, taskId);
            notifySuccess('Task deleted successfully');
        } catch (error) {
            // Restore original state on error
            setSections(originalSections);
            notifyError('Failed to delete task');
            console.error('Error deleting task:', error);
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== taskId)); // Remove task ID
        }
    };

    const handleShareSection = async (sectionId) => {
        try {
            const response = await shareSection(sectionId);
            const shareUrl = `${window.location.origin}/shared/${response.shareToken}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl);

            notification.success({
                message: 'Link Copied!',
                description: 'Share link has been copied to clipboard.',
            });
        } catch (error) {
            notification.error({
                message: 'Share Failed',
                description: error.response?.data?.error || 'Failed to generate share link.',
            });
        }
    };

    return (
        <>
            <Navbar />
            <div className="px-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                {isLoadingSections && (
                    <div className="flex flex-col items-center justify-center h-screen">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                        <p className="sm:text-2xl text-lg text-gray-700 dark:text-gray-300 mt-4">Loading sections...</p>
                    </div>
                )}
                {!isLoadingSections && sections.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-screen">
                        <p className="sm:text-2xl text-lg text-gray-700 dark:text-gray-300">You haven't created any sections yet</p>
                        <button
                            type="button"
                            onClick={() => setIsModalSectionOpen(true)}
                            className="text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 
                                focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 
                                font-medium rounded-full text-sm px-6 py-2 mt-4 transition-all duration-200"
                        >
                            Create Section
                        </button>
                    </div>
                )}
                {sections.length > 0 && (
                    <div className="flex flex-col">
                        <button
                            type="button"
                            onClick={() => setIsModalSectionOpen(true)}
                            className="text-white fixed sm:top-1/3 top-1/4 right-0 bg-gradient-to-r from-gray-800 to-gray-700 
                                dark:from-gray-700 dark:to-gray-600 opacity-60 hover:opacity-100 focus:opacity-100 
                                hover:bg-gray-900 dark:hover:bg-gray-800 focus:outline-none focus:ring-4 
                                focus:ring-gray-300 dark:focus:ring-gray-600 font-medium rounded-l-full text-sm pl-2 py-3 
                                mb-4 shadow-sm transition-all duration-300 ease-in-out transform hover:-translate-x-1 
                                hover:shadow-xl group z-50"
                            title="Create a new section"
                        >
                            <div className="flex items-center justify-center w-8 h-8 group-hover:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="hidden group-hover:flex flex-col gap-2 relative px-2">
                                <span className="font-bold">Create</span>
                                <span className="font-bold">Section</span>
                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-full 
                                    bg-blue-400 dark:bg-blue-500 transition-all duration-300 rounded-full"></div>
                            </div>
                            <span className="absolute top-1/2 -translate-y-1/2 right-full mr-2 bg-gray-800 dark:bg-gray-700 
                                text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity 
                                duration-300 whitespace-nowrap text-xs pointer-events-none">Add new section</span>
                        </button>
                        {sections.map((section) => {
                            // Check if any tasks in this section match the current filter criteria
                            const filteredTasks = filterTasks(section.tasks, section._id);

                            // Only render sections that have matching tasks or when no filters are applied
                            const hasActiveFilters = filterState.section || filterState.status ||
                                filterState.priority || filterState.dueDateRange.startDate ||
                                filterState.dueDateRange.endDate || filterState.searchTerm ||
                                filterState.tags.length > 0;

                            // If filters are active and no tasks match, don't render this section
                            if (hasActiveFilters && filteredTasks.length === 0) {
                                return null;
                            }

                            return (
                                <div key={section._id} className="block mt-8">
                                    <div className="flex gap-4 justify-center items-center ml-4">
                                        <h2 className="sm:text-lg font-bold mb-4 min-w-[100px] text-gray-900 dark:text-gray-100">
                                            {section.name}
                                        </h2>
                                        <div className="sm:w-[100%] w-[80%] h-0.5 bg-gray-800 dark:bg-gray-700"></div>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSections = sections.map(s => ({
                                                        ...s,
                                                        isMenuOpen: s._id === section._id ? !s.isMenuOpen : false
                                                    }));
                                                    setSections(newSections);
                                                }}
                                                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 
                                                focus:outline-none transition-colors duration-200 p-1"
                                                aria-label="Section options"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>
                                            {section.isMenuOpen && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                                                    <ul className="py-1">
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    dispatch(setSection(section._id));
                                                                    // Close the menu after selecting
                                                                    const newSections = sections.map(s => ({
                                                                        ...s,
                                                                        isMenuOpen: false
                                                                    }));
                                                                    setSections(newSections);
                                                                    notification.success({
                                                                        message: 'Filter Applied',
                                                                        description: `Filtering tasks in "${section.name}" section`,
                                                                    });
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                </svg>
                                                                Filter Section
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    // Close the menu first
                                                                    const newSections = sections.map(s => ({
                                                                        ...s,
                                                                        isMenuOpen: false
                                                                    }));
                                                                    setSections(newSections);
                                                                    // Then delete after a short delay to avoid UI glitches
                                                                    setTimeout(() => handleDeleteSection(section._id), 100);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Delete Section
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(true);
                                                setSectionClicked(section._id);
                                            }}
                                            className="text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 
                                            focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 
                                            font-medium rounded-lg text-sm px-6 py-2 transition-colors duration-200"
                                        >
                                            Create Task
                                        </button>

                                        {(user?.role === 'team' || user?.role === 'company') && (
                                            <button
                                                onClick={() => handleShareSection(section._id)}
                                                className="flex items-center gap-2 text-blue-500 hover:text-blue-700 
                                                focus:outline-none focus:ring-2 focus:ring-blue-300 
                                                font-medium rounded-lg text-sm px-4 py-2 transition-colors duration-200"
                                                title="Share Section"
                                            >
                                                <FontAwesomeIcon icon={faShare} />
                                                <span className="hidden sm:inline">Share</span>
                                            </button>
                                        )}
                                    </div>
                                    <TaskCard
                                        tasks={filteredTasks}
                                        handleIsDone={handleTaskIsDone}
                                        userId={section.userId}
                                        section={section}
                                        handleUpdateTask={handleUpdateTask}
                                        handleDeleteTask={handleDeleteTask}
                                        processingIds={processingIds} // Pass down processing IDs
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create Task Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-1/3">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Create a New Task</h2>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateTask(sectionClicked);
                            }}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Task Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newTask.name || ''}
                                        onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newTask.description || ''}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                        rows="3"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={newTask.priority || 'low'}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newTask.dueDate || ''}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="flex items-center text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={newTask.isImportant || false}
                                            onChange={(e) => setNewTask({ ...newTask, isImportant: e.target.checked })}
                                            className="mr-2 dark:bg-gray-800 dark:border-gray-700"
                                        />
                                        <span className="text-sm font-medium">Mark as Important</span>
                                    </label>
                                </div>                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tags (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={newTask.tags ? newTask.tags.join(', ') : ''}
                                        onChange={(e) => setNewTask({
                                            ...newTask,
                                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                                        })}
                                        placeholder="Enter tags, separated by commas"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    />
                                </div>

                                {(userRole === 'team' || userRole === 'company') && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Assign to Team Members
                                        </label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="email"
                                                value={emailInput}
                                                onChange={(e) => setEmailInput(e.target.value)}
                                                placeholder="Enter team member's email"
                                                className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (emailInput && emailInput.includes('@')) {
                                                        if (!assignedEmails.includes(emailInput)) {
                                                            setAssignedEmails([...assignedEmails, emailInput]);
                                                            setNewTask({
                                                                ...newTask,
                                                                assignedTo: [...(newTask.assignedTo || []), { email: emailInput }]
                                                            });
                                                            setEmailInput('');
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {assignedEmails.map((email, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                                                >
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAssignedEmails(assignedEmails.filter(e => e !== email));
                                                            setNewTask({
                                                                ...newTask,
                                                                assignedTo: newTask.assignedTo.filter(user => user.email !== email)
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button" onClick={() => {
                                            setIsModalOpen(false);
                                            setNewTask({
                                                name: '',
                                                description: '',
                                                priority: 'low',
                                                isImportant: false,
                                                dueDate: '',
                                                tags: [],
                                                assignedTo: []
                                            });
                                            setEmailInput('');
                                            setAssignedEmails([]);
                                        }}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <svg className="animate-spin h-5 w-5 mr-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : null}
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Section Modal */}
                {isModalSectionOpen && (
                    <div className="fixed  w-full inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-1/3">
                            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Create a New Section</h2>
                            <input
                                type="text"
                                placeholder="Section Name"
                                value={newSec.name}
                                onChange={(e) =>
                                    setNewSec({ ...newSec, name: e.target.value })
                                }
                                className="w-full mb-4 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                    border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none 
                                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsModalSectionOpen(false)}
                                    className="text-gray-700 dark:text-gray-300 px-4 py-2 mr-2 rounded-lg 
                                        hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSection}
                                    className={`text-white bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : null}
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
