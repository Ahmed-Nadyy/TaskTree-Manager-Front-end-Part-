import { faTrash, faCheckCircle, faCircle, faClock, faFlag, faPenToSquare, faStar, faExclamationCircle, faCalendarAlt, faTag, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";

export default function TaskCard({ tasks, handleIsDone, userId, section, handleUpdateTask, handleDeleteTask }) {
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [animatedTasks, setAnimatedTasks] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleTasks, setVisibleTasks] = useState(3);
    
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
        setEditingTask({...task});
        setEditModalOpen(true);
        setError(null);
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

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {getVisibleTasks().map((task) => (                    <div
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
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h2 className={`text-xl font-semibold ${
                                task.isDone 
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
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newStatus = !task.isDone;
                                        if (window.confirm(`Mark this task as ${newStatus ? 'complete' : 'incomplete'}?`)) {
                                            handleIsDone(task._id, section._id, newStatus);
                                        }
                                    }}
                                    className={`${
                                        task.isDone 
                                            ? "text-green-500 dark:text-green-400" 
                                            : "text-gray-400 dark:text-gray-500"
                                        } hover:scale-110 transition-transform duration-200`}
                                    title={task.isDone ? "Mark as incomplete" : "Mark as complete"}
                                >
                                    <FontAwesomeIcon icon={task.isDone ? faCheckCircle : faCircle} size="lg" />
                                </button>
                                
                                <button
                                    onClick={(e) => handleEditClick(e, task)}
                                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:scale-110 transition-all duration-200"
                                    title="Edit task"
                                >
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                </button>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this task?')) {
                                            handleDeleteTask(task._id, section._id);
                                        }
                                    }}
                                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:scale-110 transition-all duration-200"
                                    title="Delete task"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                        <p className={`text-gray-600 dark:text-gray-400 mb-4 ${
                            task.isDone ? "opacity-70" : ""
                            } transition-all duration-200 ${
                            hoveredTaskId === task._id ? "text-gray-800 dark:text-gray-300" : ""
                            }`}>
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
                        <div className="flex justify-between items-center">
                            <a
                                href={`/task/${userId}/${section._id}/${task._id}`}
                                className="inline-flex items-center justify-center px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg
                                    hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors duration-300 shadow-button hover:shadow-button-hover"
                                aria-label="View subtasks for this task"
                            >
                                View Subtasks
                            </a>
                            
                            {/* Task progress indicator */}
                            {task.subtaskCount > 0 && (
                                <div className="flex items-center">
                                    <div className="w-28 bg-gray-200 dark:bg-gray-700 rounded-full h-3 mr-2 shadow-inner overflow-hidden">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-700 ease-in-out ${
                                                task.subtaskCompleted === task.subtaskCount 
                                                    ? 'bg-green-500 dark:bg-green-600' 
                                                    : 'bg-blue-600 dark:bg-blue-500'
                                            }`}
                                            style={{ width: `${task.subtaskCompleted ? (task.subtaskCompleted / task.subtaskCount) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <span 
                                        className={`text-xs font-medium ${
                                            task.subtaskCompleted === task.subtaskCount 
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

            {/* Show More/Less Button for mobile */}
            {tasks.length > 3 && window.innerWidth < 640 && (
                <button
                    onClick={handleShowMore}
                    className="w-full mt-4 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                        rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 
                        transition-all duration-300 sm:hidden"
                >
                    <span className="mr-2">
                        {isExpanded ? 'Show Less' : `Show ${tasks.length - visibleTasks} More Tasks`}
                    </span>
                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                </button>
            )}

            {/* Task Counter for mobile */}
            {window.innerWidth < 640 && (
                <div className="sm:hidden text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Showing {Math.min(visibleTasks, tasks.length)} of {tasks.length} tasks
                </div>
            )}

            {/* Edit Task Modal */}
            {editModalOpen && editingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-dark-bg rounded-lg p-6 w-96 max-w-[90%]">
                        <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Edit Task</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Task Name
                                </label>
                                <input
                                    type="text"
                                    value={editingTask.name || ''}
                                    onChange={(e) => setEditingTask({...editingTask, name: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 
                                        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editingTask.description || ''}
                                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 
                                        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    rows="3"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={editingTask.priority || 'low'}
                                    onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editingTask.isImportant || false}
                                        onChange={(e) => setEditingTask({...editingTask, isImportant: e.target.checked})}
                                        className="mr-2 dark:bg-gray-800 dark:border-gray-700"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Mark as Important</span>
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        setEditingTask(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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

