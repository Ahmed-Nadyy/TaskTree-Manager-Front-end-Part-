import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faBolt, faUser, faCalendarAlt, faChevronDown, faChevronRight, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { getSections } from '../../apiService';
import { useSelector } from 'react-redux';
import { notification } from 'antd';

const TaskTreeView = ({ sectionId, taskId, onClose }) => {
    const [task, setTask] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    // Add animation styles
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .tree-node-enter {
                animation: slideDown 0.3s ease forwards;
            }
            .tree-line {
                position: relative;
            }
            .tree-line::before {
                content: '';
                position: absolute;
                left: -15px;
                top: 0;
                height: 100%;
                width: 2px;
                background: #e5e7eb;
                transform: scaleY(0);
                transform-origin: top;
                animation: growLine 0.5s ease forwards;
            }
            @keyframes growLine {
                to { transform: scaleY(1); }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Fetch task data
    useEffect(() => {
        const fetchTaskData = async () => {
            if (!user?.id || !sectionId || !taskId) return;
            
            setIsLoading(true);
            try {
                const sectionsData = await getSections(user.id);
                const currentSection = sectionsData.find(s => s._id === sectionId);
                if (currentSection) {
                    const currentTask = currentSection.tasks.find(t => t._id === taskId);
                    if (currentTask) {
                        setTask(currentTask);
                    } else {
                        notification.error({ message: 'Task not found' });
                    }
                } else {
                    notification.error({ message: 'Section not found' });
                }
            } catch (error) {
                notification.error({ message: 'Failed to load task details', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTaskData();
    }, [sectionId, taskId, user?.id]);

    // Format date to display only the date part
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Render priority icon based on priority level
    const renderPriorityIcon = (priority) => {
        const priorityLower = priority?.toLowerCase();
        let color = 'text-blue-500'; // Default for low
        
        if (priorityLower === 'high') {
            color = 'text-red-500';
        } else if (priorityLower === 'medium') {
            color = 'text-yellow-500';
        }
        
        return <FontAwesomeIcon icon={faBolt} className={`${color} ml-1`} title={`Priority: ${priority}`} />;
    };

    // Render status icon
    const renderStatusIcon = (isDone) => {
        return isDone ? 
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 ml-1" title="Completed" /> : 
            <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 ml-1" title="Not completed" />;
    };

    // Render assignment icon if assigned
    const renderAssignmentIcon = (assignedTo) => {
        if (!assignedTo || assignedTo.length === 0) return null;
        return <FontAwesomeIcon icon={faUser} className="text-blue-500 ml-1" title={`Assigned to: ${assignedTo.map(a => a.email).join(', ')}`} />;
    };

    // Render due date icon if has deadline
    const renderDueDateIcon = (date) => {
        if (!date) return null;
        return <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-500 ml-1" title={`Due: ${formatDate(date)}`} />;
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                    <div className="text-center text-red-500">Task not found</div>
                    <div className="flex justify-end mt-4">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center">
                        <FontAwesomeIcon icon={faProjectDiagram} className="mr-2 text-sky-500" />
                        Task Tree View
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="mt-4 pl-4">
                    {/* Task (Root) */}
                    <div className="font-bold text-xl mb-2 flex items-center tree-node-enter" style={{animationDelay: '0.1s'}}>
                        <span className="text-sky-600 dark:text-sky-400">{task.name}</span>
                        <div className="ml-2 flex items-center">
                            {renderStatusIcon(task.isDone)}
                            {renderPriorityIcon(task.priority)}
                            {renderAssignmentIcon(task.assignedTo)}
                            {renderDueDateIcon(task.dueDate)}
                        </div>
                    </div>
                    
                    {/* Subtasks (Leaves) */}
                    <div className="ml-6">
                        {task.subTasks && task.subTasks.length > 0 ? (
                            task.subTasks.map((subtask, index) => (
                                <div 
                                    key={subtask._id} 
                                    className="mb-3 pl-2 py-1 border-l-2 border-gray-200 dark:border-gray-700 tree-node-enter tree-line"
                                    style={{animationDelay: `${0.2 + (index * 0.05)}s`}}
                                >
                                    <div className="flex items-center">
                                        <span className="font-medium">{subtask.name}</span>
                                        <div className="ml-2 flex items-center">
                                            {renderStatusIcon(subtask.isDone)}
                                            {renderPriorityIcon(subtask.priority)}
                                            {renderAssignmentIcon(subtask.assignedTo)}
                                            {renderDueDateIcon(subtask.deadline)}
                                        </div>
                                    </div>
                                    {subtask.description && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-2">
                                            {subtask.description}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 italic tree-node-enter">
                                No subtasks for this task
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-end mt-6">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskTreeView;