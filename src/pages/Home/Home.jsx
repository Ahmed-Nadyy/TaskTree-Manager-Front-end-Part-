import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { getSections, addSection, addTask, deleteSection, updateTask, deleteTask, markTaskAsDone } from '../../apiService';
import ProtectedRoute from '../../components/ProtectedRoute.jsx';
import TaskCard from '../../components/HomeComponents/TaskCard.jsx';
import Navbar from '../../components/Navbar/Navbar.jsx';
import { notification } from 'antd';
import { Navigate, useNavigate } from "react-router-dom";

export default function Home() {
    const [sections, setSections] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalSectionOpen, setIsModalSectionOpen] = useState(false);
    const [sectionClicked, setSectionClicked] = useState(null);
    const [newSec, setNewSec] = useState({ name: "" });
    const [newTask, setNewTask] = useState({ name: "", description: "" });

    const navigate = useNavigate();

    const { isAuthenticated, user, token } = useSelector((state) => state.auth);

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
            navigate('/login');
            return;
        }
        const fetchSections = async () => {
            try {
                if (!user?.id) { console.log("err", user); return; }
                const sectionsData = await getSections(user.id, token);
                setSections(sectionsData);
                console.log("sectionsData", sectionsData);
            } catch (error) {
                console.error("Error fetching sections:", error);
            }
        };

        if (isAuthenticated && user?.id) {
            fetchSections();
        }

    }, [isAuthenticated, user]);

    const handleCreateTask = async (sectionId) => {
        try {
            const taskData = { name: newTask.name, description: newTask.description };
            const task = await addTask(sectionId, taskData);
            setSections((prevSections) =>
                prevSections.map((section) =>
                    section._id === sectionId
                        ? { ...section, tasks: [...section.tasks, taskData] }
                        : section
                )
            );
            setNewTask({ name: '', description: '' });
            setIsModalOpen(false);
            notifySuccess('Task created successfully');
        } catch (error) {
            notifyError('Error creating task');
            console.error('Error creating task:', error);
        }
    };

    const handleCreateSection = async () => {
        try {
            const sectionData = { name: newSec.name, userId: user.id };
            console.log("sectionData", sectionData);
            const newSection = await addSection(sectionData, token);
            setSections((prevSections) => [...prevSections, newSection]);
            setNewSec({ name: '' });
            setIsModalSectionOpen(false);
            notifySuccess('Section created successfully');
        } catch (error) {
            notifyError('Error creating section');
            console.error('Error creating section:', error);
        }
    };

    const handleDeleteSection = async (sectionId) => {
        try {
            await deleteSection(sectionId);
            setSections((prevSections) => prevSections.filter((section) => section._id !== sectionId));
            notifySuccess('Section deleted successfully');
        } catch (error) {
            notifyError('Error deleting section');
            console.error('Error deleting section:', error);
        }
    };

    const handleUpdateTask = async (taskId, sectionId, updatedData) => {
        try {
            await updateTask(sectionId, taskId, updatedData); // Pass sectionId in API call

            setSections(sections =>
                sections.map(section =>
                    section._id === sectionId
                        ? {
                            ...section,
                            tasks: section.tasks.map(task =>
                                task._id === taskId ? { ...task, ...updatedData } : task
                            ),
                        }
                        : section
                )
            );
            notifySuccess('Task updated successfully');
        } catch (error) {
            notifyError('Error updating task');
            console.error('Error updating task:', error);
        }
    };


    const handleDeleteTask = async (taskId, sectionId) => {
        try {
            await deleteTask(sectionId, taskId);
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
            notifySuccess('Task deleted successfully');
        } catch (error) {
            notifyError('Error deleting task');
            console.error('Error deleting task:', error);
        }
    };

    const handleTaskIsDone = async (taskId, sectionId, isChecked) => {
        try {
            if (isChecked) {
                const updatedTask = await markTaskAsDone(sectionId, taskId);
                console.log("Task marked as done:", updatedTask);

                // Option 2: OR manually update the task state
                setSections(prevSections => prevSections.map(section =>
                    section._id === sectionId
                        ? {
                            ...section,
                            tasks: section.tasks.map(task =>
                                task._id === taskId ? { ...task, isDone: true } : task
                            ),
                        }
                        : section
                ));
                notifySuccess('Task marked as done');
            } else {
                console.log("Unchecked - implement logic if needed");
            }
        } catch (error) {
            console.error("Failed to mark task as done:", error);
        }
    };


    return (
        // <ProtectedRoute>
        <>
            <Navbar />
            <div className="px-6">
                {sections.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-screen">
                        <p className="sm:text-2xl text-lg text-gray-700">You haven't created any sections yet</p>
                        <button
                            type="button"
                            onClick={() => setIsModalSectionOpen(true)}
                            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-6 py-2 mt-4"
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
                            className="text-white fixed sm:top-1/3 top-1/4 right-0 bg-gray-800 opacity-25 hover:opacity-75 focus:opacity-100 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-l-full text-sm pl-4 py-8 mb-4"
                        >
                            <div className="flex flex-col gap-2">
                                <span>Create</span>
                                <span>Section</span>
                            </div>
                        </button>
                        {sections.map((section) => (
                            <div key={section._id} className="block mt-8">
                                <div className="flex gap-4 justify-center items-center ml-4">
                                    <h2 className="text-lg font-bold mb-4 min-w-[100px]">{section.name}</h2>
                                    <div className="w-[100%] h-0.5 bg-[#111827]"></div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        setSectionClicked(section._id);
                                    }}
                                    className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-6 py-2 mb-4"
                                >
                                    Create Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteSection(section._id)}
                                    // onClick={() => console.log("sec",section.id)}
                                    className="text-white mx-3 bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-6 py-2 mb-4"
                                >
                                    Delete Section
                                </button>
                                <TaskCard
                                    tasks={section.tasks}
                                    handleIsDone={handleTaskIsDone}
                                    userId={section.userId}
                                    section={section}  // Pass the section object
                                    handleUpdateTask={handleUpdateTask}  // Pass the update handler
                                    handleDeleteTask={handleDeleteTask}  // Pass the delete handler
                                />

                            </div>
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                            <h2 className="text-lg font-bold mb-4">Create a New Task</h2>
                            <input
                                type="text"
                                placeholder="Task Name"
                                value={newTask.name}
                                onChange={(e) =>
                                    setNewTask({ ...newTask, name: e.target.value })
                                }
                                className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                                placeholder="Task Description"
                                value={newTask.description}
                                onChange={(e) =>
                                    setNewTask({ ...newTask, description: e.target.value })
                                }
                                className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-700 px-4 py-2 mr-2 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleCreateTask(sectionClicked)}
                                    className="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isModalSectionOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                            <h2 className="text-lg font-bold mb-4">Create a New Section</h2>
                            <input
                                type="text"
                                placeholder="Section Name"
                                value={newSec.name}
                                onChange={(e) =>
                                    setNewSec({ ...newSec, name: e.target.value })
                                }
                                className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsModalSectionOpen(false)}
                                    className="text-gray-700 px-4 py-2 mr-2 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSection}
                                    className="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
        // {/* </ProtectedRoute>     */}
    );
}
