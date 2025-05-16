import { faTrash, faCheckCircle, faCircle, faClock, faFlag, faPenToSquare, faStar, faExclamationCircle, faCalendarAlt, faTag, faChevronDown, faChevronUp, faShare, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { notification } from 'antd';
import { shareSection } from '../../apiService';

export default function TaskCard({ tasks, handleIsDone, userId, section, handleUpdateTask, handleDeleteTask, processingIds = [] }) {
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [animatedTasks, setAnimatedTasks] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleTasks, setVisibleTasks] = useState(3);
    const [showShareModal, setShowShareModal] = useState(false);
    const [emailInputForEdit, setEmailInputForEdit] = useState(''); // New state for email input in edit modal
    // Get user data from Redux store
    const user = useSelector(state => state.auth.user);
    const userRole = user?.role || 'solo';

    // Add animation when tasks are loaded
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedTasks(tasks.map(task => task._id));
        }, 100);
        return () => clearTimeout(timer);
    }, [tasks]);

    // Get visible tasks based on screen size
    const getVisibleTasks = () => {
        // On desktop (sm and above), show all tasks
        if (window.innerWidth >= 640) { // 640px is the 'sm' breakpoint in Tailwind
            return tasks;
        }
        // On mobile, show limited tasks based on expanded state
        return tasks.slice(0, visibleTasks);
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            // Force re-render on resize to update visible tasks
            setVisibleTasks(prev => prev);
        };
        console.log(tasks);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, []);

    // Reset visible tasks when tasks array changes
    useEffect(() => {
        setVisibleTasks(3);
        setIsExpanded(false);
    }, [tasks.length]);

    const handleShowMore = () => {
        if (isExpanded) {
            setVisibleTasks(3);
            setIsExpanded(false);
        } else {
            setVisibleTasks(tasks.length);
            setIsExpanded(true);
        }
    };

    const handleEditClick = (e, task) => {
        e.stopPropagation();
        setEditingTask({
            ...task,
            assignedTo: task.assignedTo ? [...task.assignedTo] : [] // Ensure assignedTo is an array
        });
        setEmailInputForEdit(''); // Reset email input when opening modal
        setEditModalOpen(true);
        setError(null);
    };

    const handleAddEmailToEditTask = () => {
        if (emailInputForEdit && emailInputForEdit.includes('@') && editingTask) {
            const alreadyAssigned = editingTask.assignedTo.some(user => user.email === emailInputForEdit);
            if (!alreadyAssigned) {
                setEditingTask(prev => ({
                    ...prev,
                    assignedTo: [...prev.assignedTo, { email: emailInputForEdit }]
                }));
                setEmailInputForEdit('');
            } else {
                notification.warn({ message: 'Email already assigned to this task.' });
            }
        }
    };

    const handleRemoveEmailFromEditTask = (emailToRemove) => {
        if (editingTask) {
            setEditingTask(prev => ({
                ...prev,
                assignedTo: prev.assignedTo.filter(user => user.email !== emailToRemove)
            }));
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (editingTask && handleUpdateTask) {
            setIsSubmitting(true);
            setError(null);
            try {
                await handleUpdateTask(editingTask._id, section._id, editingTask);
                setEditModalOpen(false);
                setEditingTask(null);
            } catch (err) {
                setError(err.message || 'Failed to update task');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleEditSubmit(e);
        } else if (e.key === 'Escape') {
            setEditModalOpen(false);
            setEditingTask(null);
            setError(null);
        }
    };

    const handleShareSection = async () => {
        try {
            const response = await shareSection(section._id);
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
            <div className="relative">
                {/* Task Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getVisibleTasks().map((task) => (
                        <div
                            key={task._id}
                            className={`${task.isDone ? "bg-green-200 dark:bg-green-900" : "bg-white dark:bg-dark-bg"}
                                shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-card-hover 
                                p-3 rounded-xl transition-all duration-300 
                                ${animatedTasks.includes(task._id) ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                                border-l-4 
                                ${task.isDone
                                    ? "border-green-500"
                                    : task.priority === "high"
                                        ? "border-red-500"
                                        : task.priority === "medium"
                                            ? "border-yellow-500"
                                            : "border-blue-300"}
                                sm:mb-0 mb-4 last:mb-0`}
                            onMouseEnter={() => setHoveredTaskId(task._id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                            style={{ transitionDelay: `${tasks.indexOf(task) * 50}ms` }}
                            role="article"
                            aria-label={`Task: ${task.name}`}
                            tabIndex="0"
                            onKeyDown={(e) => {
                                // Handle keyboard navigation within task card
                                if (e.key === 'Enter') {
                                    // Open subtasks view on Enter key
                                    window.location.href = `/sections/${section._id}/tasks/${task._id}/subtasks`;
                                }
                            }}
                            onClick={() => {
                                // Navigate to subtasks view
                                window.location.href = `/sections/${section._id}/tasks/${task._id}/subtasks`;
                            }}
                            aria-roledescription="Task card"
                            aria-busy={isSubmitting}
                            aria-describedby={`task-description-${task._id}`}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h2 className={`text-xl font-semibold ${task.isDone
                                    ? "text-green-700 dark:text-green-400 line-through"
                                    : "text-gray-800 dark:text-gray-200"
                                    } group flex items-center`}>
                                    {task.priority === "high" && (
                                        <FontAwesomeIcon
                                            icon={faExclamationCircle}
                                            className="text-red-500 mr-2 animate-pulse"
                                            title="High Priority"
                                        />
                                    )}
                                    {task.name}
                                    {task.isImportant && (
                                        <FontAwesomeIcon
                                            icon={faStar}
                                            className="text-yellow-400 ml-2"
                                            title="Important task"
                                        />
                                    )}
                                </h2>
                                <div className="flex items-center space-x-3">
                                    <div className="flex gap-2">
                                        <span>done?</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newStatus = !task.isDone;
                                                if (window.confirm(`Mark this task as ${newStatus ? 'complete' : 'incomplete'}?`)) {
                                                    handleIsDone(task._id, section._id, newStatus);
                                                }
                                            }}
                                            className={`${task.isDone
                                                ? "text-green-500 dark:text-green-400"
                                                : "text-gray-400 dark:text-gray-500"
                                                } hover:scale-110 transition-transform duration-200`}
                                            title={task.isDone ? "Mark as incomplete" : "Mark as complete"}
                                            aria-label={task.isDone ? "Mark task as incomplete" : "Mark task as complete"}
                                            aria-pressed={task.isDone}
                                            disabled={processingIds.includes(task._id)} // Disable if processing
                                        >
                                            {processingIds.includes(task._id) ? (
                                                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <FontAwesomeIcon icon={task.isDone ? faCheckCircle : faCircle} size="lg" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Only show edit button if user is the owner of the section */}
                                    {section.userId === user.id && (
                                        <button
                                            onClick={(e) => handleEditClick(e, task)}
                                            className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:scale-110 transition-all duration-200"
                                            title="Edit task"
                                            aria-label={`Edit task: ${task.name}`}
                                            disabled={processingIds.includes(task._id)} // Disable if processing
                                        >
                                            {processingIds.includes(task._id) ? (
                                                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            )}
                                        </button>
                                    )}

                                    {/* Only show delete button if user is the owner of the section */}
                                    {section.userId === user.id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to delete this task?')) {
                                                    handleDeleteTask(task._id, section._id);
                                                }
                                            }}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:scale-110 transition-all duration-200"
                                            title="Delete task"
                                            aria-label={`Delete task: ${task.name}`}
                                            disabled={processingIds.includes(task._id)} // Disable if processing
                                        >
                                            {processingIds.includes(task._id) ? (
                                                <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <FontAwesomeIcon icon={faTrash} />

                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p
                                id={`task-description-${task._id}`}
                                className={`text-gray-600 dark:text-gray-400 mb-4 ${task.isDone ? "opacity-70" : ""
                                    } transition-all duration-200 ${hoveredTaskId === task._id ? "text-gray-800 dark:text-gray-300" : ""
                                    }`}
                            >
                                {task.description || "No description provided"}
                            </p>

                            {/* Task metadata */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                                {task.dueDate && (
                                    <div
                                        className={`flex items-center px-2 py-1 rounded-lg transition-all duration-300 ${new Date(task.dueDate) < new Date() && !task.isDone
                                            ? 'text-white bg-red-500 font-medium animate-pulse'
                                            : new Date(task.dueDate) < new Date(Date.now() + 86400000 * 2) && !task.isDone
                                                ? 'text-orange-800 bg-orange-100'
                                                : 'text-gray-700 bg-gray-100'}`}
                                        title={new Date(task.dueDate) < new Date() && !task.isDone ? "Overdue!" : "Due date"}
                                    >
                                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                )}

                                {task.priority && (
                                    <div
                                        className={`flex items-center px-3 py-1 rounded-lg text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md
                                            ${task.priority === 'high'
                                                ? 'bg-red-100 text-red-800 border border-red-200'
                                                : task.priority === 'medium'
                                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                    : 'bg-blue-100 text-blue-800 border border-blue-200'}`}
                                        title={`Priority: ${task.priority}`}
                                    >
                                        <FontAwesomeIcon icon={faFlag} className="mr-2" />
                                        <span className="capitalize">{task.priority || 'Normal'}</span>
                                    </div>
                                )}

                                {task.tags && task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {task.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs border border-gray-200 hover:bg-gray-200 transition-colors duration-200 flex items-center"
                                                title={`Tag: ${tag}`}
                                            >
                                                <FontAwesomeIcon icon={faTag} className="mr-1 text-gray-500" size="xs" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Assigned Users Display */}
                            {task.assignedTo && task.assignedTo.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2 mb-3">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                        <span>Assigned to:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {task.assignedTo.map((user, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs
                                                    bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                            >
                                                {user.email}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <a
                                    href={`/sections/${section._id}/tasks/${task._id}/subtasks`}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg
                                        hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors duration-300 shadow-button hover:shadow-button-hover"
                                    aria-label={`View subtasks for ${task.name}`}
                                    role="button"
                                    tabIndex="0"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            window.location.href = `/sections/${section._id}/tasks/${task._id}/subtasks`;
                                        }
                                    }}
                                >
                                    View Subtasks
                                </a>

                                {/* Task progress indicator */}
                                {task.subtaskCount > 0 && (
                                    <div className="flex items-center">
                                        <div className="w-28 bg-gray-200 dark:bg-gray-700 rounded-full h-3 mr-2 shadow-inner overflow-hidden">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-700 ease-in-out ${task.subtaskCompleted === task.subtaskCount
                                                    ? 'bg-green-500 dark:bg-green-600'
                                                    : 'bg-blue-600 dark:bg-blue-500'
                                                    }`}
                                                style={{ width: `${task.subtaskCompleted ? (task.subtaskCompleted / task.subtaskCount) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <span
                                            className={`text-xs font-medium ${task.subtaskCompleted === task.subtaskCount
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                            title="Subtasks completed"
                                        >
                                            {task.subtaskCompleted || 0}/{task.subtaskCount || 0}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Existing mobile view controls */}
                {tasks.length > 3 && window.innerWidth < 640 && (
                    <button
                        onClick={handleShowMore}
                        className="w-full mt-4 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                            rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 
                            transition-all duration-300 sm:hidden"
                        aria-expanded={isExpanded}
                        aria-controls="task-list"
                        aria-label={isExpanded ? 'Show fewer tasks' : `Show ${tasks.length - visibleTasks} more tasks`}
                    >
                        <span className="mr-2">
                            {isExpanded ? 'Show Less' : `Show ${tasks.length - visibleTasks} More Tasks`}
                        </span>
                        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                    </button>
                )}

                {window.innerWidth < 640 && (
                    <div className="sm:hidden text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                        Showing {Math.min(visibleTasks, tasks.length)} of {tasks.length} tasks
                    </div>
                )}
            </div>

            {/* Edit Task Modal */}
            {editModalOpen && editingTask && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-task-title"
                >
                    <div
                        className="bg-white dark:bg-dark-bg rounded-lg p-6 w-96 max-w-[90%]"
                        tabIndex="-1"
                    >
                        <h2 id="edit-task-title" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Task</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Task Name
                                </label>
                                <input
                                    type="text"
                                    value={editingTask.name || ''}
                                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
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
                                    value={editingTask.description || ''}
                                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
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
                                    value={editingTask.priority || 'low'}
                                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
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
                                    value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editingTask.isImportant || false}
                                        onChange={(e) => setEditingTask({ ...editingTask, isImportant: e.target.checked })}
                                        className="mr-2 dark:bg-gray-800 dark:border-gray-700"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Important</span>
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={editingTask.tags ? editingTask.tags.join(', ') : ''}
                                    onChange={(e) => setEditingTask({
                                        ...editingTask,
                                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                                    })}
                                    placeholder="Enter tags, separated by commas"
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                />
                            </div>

                            {/* Assigned Emails Management - START */}
                            {(userRole === 'team' || userRole === 'company') && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Assign to Team Members
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="email"
                                            value={emailInputForEdit}
                                            onChange={(e) => setEmailInputForEdit(e.target.value)}
                                            placeholder="Enter team member's email"
                                            className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddEmailToEditTask}
                                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                                        >
                                            Add Email
                                        </button>
                                    </div>
                                    {editingTask.assignedTo && editingTask.assignedTo.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Currently assigned:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {editingTask.assignedTo.map((user, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                                                    >
                                                        <span>{user.email}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveEmailFromEditTask(user.email)}
                                                            className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                            aria-label={`Remove ${user.email}`}
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Assigned Emails Management - END */}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        setEditingTask(null);
                                        setError(null); // Clear error on cancel
                                    }}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                    aria-label="Cancel editing task"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-label="Save task changes"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : null}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>
                </div>
            )}
        </>
    );
}

