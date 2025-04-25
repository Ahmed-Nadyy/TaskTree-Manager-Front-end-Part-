import { faTrash, faCheckCircle, faCircle, faClock, faFlag, faPenToSquare, faStar, faExclamationCircle, faCalendarAlt, faTag } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";

export default function TaskCard({ tasks, handleIsDone, userId, section, handleUpdateTask, handleDeleteTask }) {
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [animatedTasks, setAnimatedTasks] = useState([]);
    
    // Add animation when tasks are loaded
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedTasks(tasks.map(task => task._id));
        }, 100);
        return () => clearTimeout(timer);
    }, [tasks]);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className={`${task.isDone ? "bg-green-200" : "bg-white"}
                        shadow-card hover:shadow-card-hover p-3 rounded-xl transition-all duration-300 
                        ${animatedTasks.includes(task._id) ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                        border-l-4 
                        ${task.isDone ? "border-green-500" : task.priority === "high" ? "border-red-500" : task.priority === "medium" ? "border-yellow-500" : "border-blue-300"}`}
                    onClick={() => { console.log(task._id, section._id); }}
                    onMouseEnter={() => setHoveredTaskId(task._id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    style={{ transitionDelay: `${tasks.indexOf(task) * 50}ms` }}
                    role="article"
                    aria-label={`Task: ${task.name}`}
                >
                    <div className="flex justify-between items-center mb-3">
                        <h2 className={`text-xl font-semibold ${task.isDone ? "text-green-700 line-through" : "text-gray-800"} group flex items-center`}>
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
                                className={`${task.isDone ? "text-green-500" : "text-gray-400"} 
                                    hover:scale-110 transition-transform duration-200`}
                                title={task.isDone ? "Mark as incomplete" : "Mark as complete"}
                                aria-label={task.isDone ? "Mark as incomplete" : "Mark as complete"}
                            >
                                <FontAwesomeIcon icon={task.isDone ? faCheckCircle : faCircle} size="lg" />
                            </button>
                            
                            {/* Edit Task Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Implement edit functionality
                                    handleUpdateTask && handleUpdateTask(task._id, section._id, task);
                                }}
                                className="text-blue-500 hover:text-blue-700 hover:scale-110 transition-all duration-200"
                                title="Edit task"
                                aria-label="Edit task"
                            >
                                <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            
                            {/* Delete Task Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to delete this task?')) {
                                        handleDeleteTask(task._id, section._id);
                                    }
                                }}
                                className="text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200"
                                title="Delete task"
                                aria-label="Delete task"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    </div>
                    <p className={`text-gray-600 mb-4 ${task.isDone ? "opacity-70" : ""} transition-all duration-200 ${hoveredTaskId === task._id ? "text-gray-800" : ""}`}>
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
                            className="inline-flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg
                                hover:bg-gray-900 transition-colors duration-300 shadow-button hover:shadow-button-hover"
                            aria-label="View subtasks for this task"
                        >
                            View Subtasks
                        </a>
                        
                        {/* Task progress indicator */}
                        {task.subtaskCount > 0 && (
                            <div className="flex items-center">
                                <div className="w-28 bg-gray-200 rounded-full h-3 mr-2 shadow-inner overflow-hidden">
                                    <div 
                                        className={`h-3 rounded-full transition-all duration-700 ease-in-out ${task.subtaskCompleted === task.subtaskCount ? 'bg-green-500' : 'bg-blue-600'}`}
                                        style={{ width: `${task.subtaskCompleted ? (task.subtaskCompleted / task.subtaskCount) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span 
                                    className={`text-xs font-medium ${task.subtaskCompleted === task.subtaskCount ? 'text-green-600' : 'text-gray-600'}`}
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
    );
}

