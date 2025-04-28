import React, { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import { useParams } from "react-router-dom";
import {
    getSections,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    markSubTaskAsDone, 
} from "../../apiService";
import { notification } from 'antd';

export default function TaskDetails() {
    // Add CSS animations
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from { transform: scale(0); }
                to { transform: scale(1); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .animate-fade-in-down {
                animation: fadeInDown 0.5s ease-out forwards;
            }
            .animate-fade-in {
                animation: fadeIn 0.3s ease-out forwards;
            }
            .animate-scale-in {
                animation: scaleIn 0.2s ease-out forwards;
            }
            .animate-shake {
                animation: shake 0.5s ease-in-out;
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const { userId, sectionId, taskId } = useParams();
    const [subTasks, setSubTasks] = useState([]);
    const [newSubTask, setNewSubTask] = useState("");
    const [taskName, setTaskName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSubTaskId, setEditingSubTaskId] = useState(null);
    const [updatedSubTaskName, setUpdatedSubTaskName] = useState("");
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredSubTasks, setFilteredSubTasks] = useState([]);
    
    const notifySuccess = (message) => {
        notification.success({
            message: 'Success',
            description: message,
            placement: 'bottomRight',
        });
    };

    const notifyError = (message) => {
        notification.error({
            message: 'Error',
            description: message,
            placement: 'bottomRight',
        });
    };

    const fetchSubTasks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const sections = await getSections(userId);
            const section = sections.find((section) => section._id === sectionId);
            if (section) {
                const task = section.tasks.find((task) => task._id === taskId);
                if (task) {
                    setTaskName(task.name);
                    setSubTasks(task.subTasks || []);
                } else {
                    setError("Task not found");
                }
            } else {
                setError("Section not found");
            }
        } catch (error) {
            console.error("Error fetching subtasks:", error);
            setError("Failed to load subtasks");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubTasks();
    }, [userId, sectionId, taskId]);

    useEffect(() => {
        if (subTasks.length > 0) {
            const filtered = subTasks.filter(task => 
                task.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredSubTasks(filtered);
        } else {
            setFilteredSubTasks([]);
        }
    }, [searchQuery, subTasks]);

    const handleAddSubTask = async () => {
        if (!newSubTask.trim()) return;
        
        setIsSubmitting(true);
        try {
            const subtaskData = { name: newSubTask, isDone: false };
            // Optimistic update
            const tempId = Date.now().toString();
            setSubTasks(prev => [...prev, { ...subtaskData, _id: tempId }]);
            setNewSubTask("");
            
            await addSubTask(sectionId, taskId, subtaskData);
            await fetchSubTasks(); // Refresh to get the real ID
            notifySuccess("Subtask added successfully");
        } catch (error) {
            console.error("Error adding subtask:", error);
            // Remove the temporary subtask if the request failed
            setSubTasks(prev => prev.filter(st => st._id !== tempId));
            notifyError("Failed to add subtask");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleSubTask = async (subTaskId) => {
        try {
            const subTask = subTasks.find((sub) => sub._id === subTaskId);
            if (!subTask) return;

            const updatedStatus = !subTask.isDone;
            
            // Optimistic update
            setSubTasks(subTasks.map((sub) =>
                sub._id === subTaskId ? { ...sub, isDone: updatedStatus } : sub
            ));
            
            await markSubTaskAsDone(sectionId, taskId, subTaskId);
            notifySuccess(`Subtask marked as ${updatedStatus ? 'complete' : 'incomplete'}`);
        } catch (error) {
            console.error("Error toggling subtask:", error);
            // Revert the optimistic update
            setSubTasks(subTasks.map((sub) =>
                sub._id === subTaskId ? { ...sub, isDone: !updatedStatus } : sub
            ));
            notifyError("Failed to update subtask status");
        }
    };

    const handleRemoveSubTask = async (subTaskId) => {
        if (!window.confirm("Are you sure you want to delete this subtask?")) return;

        try {
            // Optimistic delete
            const removedSubTask = subTasks.find(st => st._id === subTaskId);
            setSubTasks(prev => prev.filter(st => st._id !== subTaskId));
            
            await deleteSubTask(sectionId, taskId, subTaskId);
            notifySuccess("Subtask deleted successfully");
        } catch (error) {
            console.log("Error deleting subtask:", error);
            // Restore the subtask if delete failed
            setSubTasks(prev => [...prev, removedSubTask]);
            notifyError("Failed to delete subtask");
        }
    };

    const handleEditSubTask = (subTask) => {
        setEditingSubTaskId(subTask._id);
        setUpdatedSubTaskName(subTask.name);
        setError(null);
    };

    const handleCancelEdit = () => {
        setEditingSubTaskId(null);
        setUpdatedSubTaskName("");
        setError(null);
    };

    const handleSaveEdit = async (subTaskId) => {
        if (!updatedSubTaskName.trim()) return;
        
        setIsSubmitting(true);
        const originalSubTasks = [...subTasks];
        try {
            // Optimistic update
            setSubTasks(subTasks.map(sub =>
                sub._id === subTaskId ? { ...sub, name: updatedSubTaskName } : sub
            ));
            handleCancelEdit();
            
            const updatedSubTaskData = { name: updatedSubTaskName };
            await updateSubTask(sectionId, taskId, subTaskId, updatedSubTaskData);
            notifySuccess("Subtask updated successfully");
        } catch (error) {
            console.log("Error updating subtask:", error);
            // Restore original state if update failed
            setSubTasks(originalSubTasks);
            notifyError("Failed to update subtask");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Add new subtask with Ctrl+Enter
            if (e.ctrlKey && e.key === 'Enter' && document.activeElement.placeholder === "Enter your subtask here") {
                handleAddSubTask();
            }
            
            // Cancel editing with Escape key
            if (e.key === 'Escape' && editingSubTaskId) {
                handleCancelEdit();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [newSubTask, editingSubTaskId]);

    if (error) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
                    <div className="bg-white dark:bg-dark-bg shadow-lg rounded-lg p-8 max-w-md w-full mx-4 animate-shake">
                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
                        <p className="text-gray-700 dark:text-gray-300">{error}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 pt-10 flex justify-center">
                <div className="bg-white dark:bg-dark-bg shadow-lg dark:shadow-dark-card rounded-2xl p-6 max-w-lg w-full animate-fade-in-down">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-400">
                            {taskName} Details
                        </h1>
                    </div>

                    {/* Search input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search subtasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border-2 border-blue-300 dark:border-blue-700 rounded-lg p-2 
                                bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                    </div>

                    <div className="mt-4 flex sm:flex-row flex-col items-center gap-3">
                        <input
                            className="flex-grow border-2 border-blue-300 dark:border-blue-700 rounded-lg p-2 
                                bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            type="text"
                            placeholder="Enter your subtask here"
                            value={newSubTask}
                            onChange={(e) => setNewSubTask(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddSubTask();
                                }
                            }}
                        />
                        <button
                            className={`bg-blue-500 dark:bg-blue-600 sm:text-lg text-xs text-white font-medium px-4 py-2 rounded-lg 
                                hover:bg-blue-600 dark:hover:bg-blue-700 transition flex items-center justify-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                            onClick={handleAddSubTask}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </>
                            ) : 'Add SubTask'}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                        </div>
                    ) : (
                        <ul className="space-y-4 mt-6">
                            {filteredSubTasks.map((subTask) => (
                                <li
                                    key={subTask._id}
                                    className={`flex items-center justify-between border rounded-lg p-4 shadow-sm transition-all duration-300 ease-in-out transform hover:scale-[1.01] 
                                        ${subTask.isDone 
                                            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' 
                                            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'} animate-fade-in`}
                                >
                                    <div className="flex items-center gap-4 flex-grow">
                                        {subTask.isDone ? (
                                            <div 
                                                className="h-5 w-5 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center text-white cursor-pointer animate-scale-in"
                                                onClick={() => handleToggleSubTask(subTask._id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 text-blue-500 dark:text-blue-400 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 cursor-pointer"
                                                checked={subTask.isDone}
                                                onChange={() => handleToggleSubTask(subTask._id)}
                                            />
                                        )}

                                        {editingSubTaskId === subTask._id ? (
                                            <input
                                                type="text"
                                                value={updatedSubTaskName}
                                                onChange={(e) => setUpdatedSubTaskName(e.target.value)}
                                                className="flex-grow border-b-2 border-blue-400 dark:border-blue-600 
                                                    focus:outline-none focus:ring-1 focus:ring-blue-500 
                                                    dark:focus:ring-blue-400 px-2 py-1 bg-white dark:bg-gray-800 
                                                    text-gray-800 dark:text-gray-200"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveEdit(subTask._id);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEdit();
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <p className={`text-lg transition-all duration-200 
                                                ${subTask.isDone
                                                    ? "line-through text-gray-400 dark:text-gray-500"
                                                    : "text-gray-800 dark:text-gray-200"}`}
                                            >
                                                {subTask.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {editingSubTaskId === subTask._id ? (
                                            <>
                                                <button
                                                    className={`bg-green-500 dark:bg-green-600 text-white px-3 py-1 rounded hover:bg-green-600 dark:hover:bg-green-700 
                                                        text-sm transition-colors duration-200 flex items-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                    onClick={() => handleSaveEdit(subTask._id)}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Saving...
                                                        </>
                                                    ) : 'Save'}
                                                </button>
                                                <button
                                                    className="bg-gray-400 dark:bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500 dark:hover:bg-gray-700 
                                                        text-sm transition-colors duration-200"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 
                                                        transition-colors duration-200 text-sm px-2 py-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                                                    onClick={() => handleEditSubTask(subTask)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 
                                                        transition-colors duration-200 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                                                    onClick={() => handleRemoveSubTask(subTask._id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {filteredSubTasks.length === 0 && searchQuery && (
                                <li className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    No subtasks found matching "{searchQuery}"
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
