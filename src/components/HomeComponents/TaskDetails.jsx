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
            .animate-fade-in-down {
                animation: fadeInDown 0.5s ease-out forwards;
            }
            .animate-fade-in {
                animation: fadeIn 0.3s ease-out forwards;
            }
            .animate-scale-in {
                animation: scaleIn 0.2s ease-out forwards;
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


    const fetchSubTasks = async () => {
        setIsLoading(true);
        try {
            const sections = await getSections(userId);
            const section = sections.find((section) => section._id === sectionId);
            if (section) {
                const task = section.tasks.find((task) => task._id === taskId);
                setTaskName(task.name);
                if (task) {
                    setSubTasks(task.subTasks || []);
                }
            }
        } catch (error) {
            console.error("Error fetching subtasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch subtasks on load
    useEffect(() => {
        fetchSubTasks();
    }, [userId, sectionId, taskId]);

    // Add new subtask
    const handleAddSubTask = async () => {
        if (newSubTask.trim()) {
            setIsSubmitting(true);
            try {
                const subtaskData = { name: newSubTask, isDone: false };
                await addSubTask(sectionId, taskId, subtaskData);
                fetchSubTasks();
                setNewSubTask("");
            } catch (error) {
                console.error("Error adding subtask:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Toggle subtask isDone status
    const handleToggleSubTask = async (subTaskId) => {
        try {
            const subTask = subTasks.find((sub) => sub._id === subTaskId);
            if (!subTask) return;

            const updatedStatus = !subTask.isDone;
            
            // Update local state immediately for better UX
            setSubTasks(subTasks.map((sub) =>
                sub._id === subTaskId ? { ...sub, isDone: updatedStatus } : sub
            ));
            
            await markSubTaskAsDone(sectionId, taskId, subTaskId);
        } catch (error) {
            console.error("Error toggling subtask:", error);
            // Revert the state if API call fails
            setSubTasks(subTasks.map((sub) =>
                sub._id === subTaskId ? { ...sub, isDone: !updatedStatus } : sub
            ));
        }
    };

    // Delete subtask
    const handleRemoveSubTask = async (subTaskId) => {
        try {
            await deleteSubTask(sectionId, taskId, subTaskId);
            setSubTasks(subTasks.filter((sub) => sub._id !== subTaskId));
        } catch (error) {
            console.log("Error deleting subtask:", error);
        }
    };

    // Start editing subtask
    const handleEditSubTask = (subTask) => {
        setEditingSubTaskId(subTask._id);
        setUpdatedSubTaskName(subTask.name);
    };

    // Cancel editing subtask
    const handleCancelEdit = () => {
        setEditingSubTaskId(null);
        setUpdatedSubTaskName("");
    };

    // Save edited subtask
    const handleSaveEdit = async (subTaskId) => {
        if (!updatedSubTaskName.trim()) return; 
        
        setIsSubmitting(true);
        try {
            const updatedSubTaskData = { name: updatedSubTaskName };
            await updateSubTask(sectionId, taskId, subTaskId, updatedSubTaskData);

            const updatedSubTasks = subTasks.map((sub) =>
                sub._id === subTaskId ? { ...sub, name: updatedSubTaskName } : sub
            );
            setSubTasks(updatedSubTasks);
            handleCancelEdit();
        } catch (error) {
            console.log("Error updating subtask:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle keyboard shortcuts
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

    return (
        <>
            <Navbar />
            <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pt-10 flex justify-center">
                <div className="bg-white shadow-lg rounded-2xl p-6 max-w-lg w-full animate-fade-in-down">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-extrabold text-blue-700">
                            {taskName} Details
                        </h1>
                        <div className="mt-4 flex sm:flex-row flex-col items-center gap-3">
                            <input
                                className="flex-grow border-2 border-blue-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className={`bg-blue-500 sm:text-lg text-xs text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
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
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                                {subTasks.map((subTask) => (
                                    <li
                                        key={subTask._id}
                                        className={`flex items-center justify-between border rounded-lg p-4 shadow-sm transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${subTask.isDone ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} animate-fade-in`}
                                    >
                                <div className="flex items-center gap-4 flex-grow">
                                    {subTask.isDone ? (
                                        <div 
                                            className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center text-white cursor-pointer animate-scale-in"
                                            onClick={() => handleToggleSubTask(subTask._id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 text-blue-500 focus:ring-2 focus:ring-blue-400 cursor-pointer"
                                            checked={subTask.isDone}
                                            onChange={() => handleToggleSubTask(subTask._id)}
                                        />
                                    )}

                                    {/* Editing Mode */}
                                    {editingSubTaskId === subTask._id ? (
                                        <input
                                            type="text"
                                            value={updatedSubTaskName}
                                            onChange={(e) => setUpdatedSubTaskName(e.target.value)}
                                            className="flex-grow border-b-2 border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1 bg-white"
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
                                        <p
                                            className={`text-lg ${subTask.isDone
                                                    ? "line-through text-gray-400"
                                                    : "text-gray-800"
                                                } transition-all duration-200`}
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
                                                className={`bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm transition-colors duration-200 flex items-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
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
                                                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm transition-colors duration-200"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 text-sm px-2 py-1 rounded hover:bg-yellow-50"
                                                onClick={() => handleEditSubTask(subTask)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-red-500 hover:text-red-600 transition-colors duration-200 text-sm px-2 py-1 rounded hover:bg-red-50"
                                                onClick={() => handleRemoveSubTask(subTask._id)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                                ))}  
                        </ul>
                    )}
                    
                    {/* Keyboard shortcuts help */}
                    <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium mb-1">Keyboard shortcuts:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to add a new subtask</li>
                            <li>Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Escape</kbd> to cancel editing</li>
                            <li>Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to save while editing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
