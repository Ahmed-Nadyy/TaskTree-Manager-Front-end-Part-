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
    const { userId, sectionId, taskId } = useParams();

    const [subTasks, setSubTasks] = useState([]);
    const [newSubTask, setNewSubTask] = useState("");
    const [taskName, setTaskName] = useState("");

    const [editingSubTaskId, setEditingSubTaskId] = useState(null);
    const [updatedSubTaskName, setUpdatedSubTaskName] = useState("");


    const fetchSubTasks = async () => {
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
        }
    };

    // Fetch subtasks on load
    useEffect(() => {
        fetchSubTasks();
    }, [userId, sectionId, taskId]);

    // Add new subtask
    const handleAddSubTask = async () => {
        if (newSubTask.trim()) {
            try {
                const subtaskData = { name: newSubTask, isDone: false };
                const subtask = await addSubTask(sectionId, taskId, subtaskData);
                // setSubTasks([...subTasks, subtask]);
                fetchSubTasks();
                setNewSubTask("");
            } catch (error) {
                console.error("Error adding subtask:", error);
            }
        }
    };

    // Toggle subtask isDone status
    const handleToggleSubTask = async (subTaskId) => {
        try {
            const subTask = subTasks.find((sub) => sub._id === subTaskId);
            if (!subTask) return;

            const updatedStatus = !subTask.isDone;
            await markSubTaskAsDone(sectionId, taskId, subTaskId);

            const updatedSubTasks = subTasks.map((sub) =>
                sub._id === subTaskId ? { ...sub, isDone: updatedStatus } : sub
            );
            setSubTasks(updatedSubTasks);
        } catch (error) {
            console.log("Error toggling subtask:", error);
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
        }
    };

    return (
        <>
            <Navbar />
            <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pt-10 flex justify-center">
                <div className="bg-white shadow-lg rounded-2xl p-6 max-w-lg w-full">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-extrabold text-blue-700">
                            {taskName} Details
                        </h1>
                        <div className="mt-4 flex items-center gap-3">
                            <input
                                className="flex-grow border-2 border-blue-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="text"
                                placeholder="Enter your subtask here"
                                value={newSubTask}
                                onChange={(e) => setNewSubTask(e.target.value)}
                            />
                            <button
                                className="bg-blue-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                                onClick={handleAddSubTask}
                            >
                                Add SubTask
                            </button>
                        </div>
                    </div>

                    <ul className="space-y-4">
                        {subTasks.map((subTask) => (
                            <li
                                key={subTask._id}
                                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm"
                            >
                                <div className="flex items-center gap-4 flex-grow">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 text-blue-500 focus:ring-2 focus:ring-blue-400"
                                        checked={subTask.isDone}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                handleToggleSubTask(subTask._id);
                                            }
                                        }}
                                        style={{ display: subTask.isDone ? "none" : "initial" }}
                                    />

                                    {/* Editing Mode */}
                                    {editingSubTaskId === subTask._id ? (
                                        <input
                                            type="text"
                                            value={updatedSubTaskName}
                                            onChange={(e) => setUpdatedSubTaskName(e.target.value)}
                                            className="flex-grow border-b-2 border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1"
                                        />
                                    ) : (
                                        <p
                                            className={`text-lg ${subTask.isDone
                                                    ? "line-through text-gray-400"
                                                    : "text-gray-800"
                                                }`}
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
                                                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                                                onClick={() => handleSaveEdit(subTask._id)}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 text-sm"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="text-yellow-500 hover:text-yellow-600 transition text-sm"
                                                onClick={() => handleEditSubTask(subTask)}
                                            >
                                                Edit
                                            </button>
                                            {/* <button
                                                className="text-red-500 hover:text-red-600 transition text-sm"
                                                onClick={() => handleRemoveSubTask(subTask._id)}
                                            >
                                                Delete
                                            </button> */}
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
