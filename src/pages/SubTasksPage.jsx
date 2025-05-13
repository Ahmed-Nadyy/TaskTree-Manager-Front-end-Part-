import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSelector } from 'react-redux';
import { getSections, updateSubTask, addSubTask } from '../apiService'; // Assuming addSubTask is available
import Navbar from '../components/Navbar/Navbar';
import { notification } from 'antd';

const SubTasksPage = () => {
    const { sectionId, taskId } = useParams();
    const [section, setSection] = useState(null);
    const [task, setTask] = useState(null);
    const [columns, setColumns] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newSubTaskName, setNewSubTaskName] = useState('');
    const [showAddSubTaskModal, setShowAddSubTaskModal] = useState(false);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [selectedAssignee, setSelectedAssignee] = useState('');

    const { user } = useSelector((state) => state.auth);

    const fetchTaskDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            // We need to fetch all sections to find the specific one, then the task.
            // This could be optimized if there's a direct API to fetch a single task or section.
            const sectionsData = await getSections(user.id); // Assuming user.id is the owner of the section
            const currentSection = sectionsData.find(s => s._id === sectionId);
            if (currentSection) {
                const currentTask = currentSection.tasks.find(t => t._id === taskId);
                if (currentTask) {
                    setSection(currentSection);
                    setTask(currentTask);
                    setAssignableUsers(currentTask.assignedTo.map(u => u.email)); // Users assigned to the parent task

                    // Initialize columns based on subtask status
                    const subTasks = currentTask.subTasks || [];
                    setColumns({
                        pending: {
                            name: 'Pending',
                            items: subTasks.filter(st => st.status === 'pending' || !st.status) // Default to pending if status is undefined
                        },
                        inProgress: {
                            name: 'In Progress',
                            items: subTasks.filter(st => st.status === 'in progress')
                        },
                        done: {
                            name: 'Done',
                            items: subTasks.filter(st => st.status === 'done')
                        }
                    });
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
    }, [sectionId, taskId, user?.id]);

    useEffect(() => {
        if (user?.id) {
            fetchTaskDetails();
        }
    }, [fetchTaskDetails, user?.id]);

    const onDragEnd = async (result, cols, setCols) => {
        if (!result.destination) return;
        const { source, destination } = result;

        const sourceColumn = cols[source.droppableId];
        const destColumn = cols[destination.droppableId];
        const sourceItems = [...sourceColumn.items];
        const destItems = [...destColumn.items];
        const [removed] = sourceItems.splice(source.index, 1);
        
        let newStatus = '';
        if (destination.droppableId === 'pending') newStatus = 'pending';
        else if (destination.droppableId === 'inProgress') newStatus = 'in progress';
        else if (destination.droppableId === 'done') newStatus = 'done';

        removed.status = newStatus; // Update status on the item

        if (source.droppableId === destination.droppableId) {
            sourceItems.splice(destination.index, 0, removed);
            setCols({
                ...cols,
                [source.droppableId]: {
                    ...sourceColumn,
                    items: sourceItems
                }
            });
        } else {
            destItems.splice(destination.index, 0, removed);
            setCols({
                ...cols,
                [source.droppableId]: {
                    ...sourceColumn,
                    items: sourceItems
                },
                [destination.droppableId]: {
                    ...destColumn,
                    items: destItems
                }
            });
        }

        try {
            await updateSubTask(sectionId, taskId, removed._id, { status: newStatus, isDone: newStatus === 'done' });
            notification.success({ message: 'Subtask status updated!' });
            // Optionally re-fetch or update local state more deeply if needed
        } catch (error) {
            notification.error({ message: 'Failed to update subtask status', description: error.message });
            // Revert UI changes on error
            fetchTaskDetails(); // Simplest way to revert, could be more sophisticated
        }
    };

    const handleAddSubTask = async () => {
        if (!newSubTaskName.trim()) {
            notification.error({ message: 'Subtask name cannot be empty.' });
            return;
        }
        try {
            // const newSubtaskData = { name: newSubTaskName, assignedTo: selectedAssignee ? [{email: selectedAssignee}] : [] };
            // The backend for addSubTask might not support assigning users directly, check API
            const response = await addSubTask(sectionId, taskId, { name: newSubTaskName }); 
            setShowAddSubTaskModal(false);
            setNewSubTaskName('');
            // setSelectedAssignee('');
            notification.success({ message: 'Subtask added successfully!' });
            fetchTaskDetails(); // Re-fetch to update the columns
        } catch (error) {
            notification.error({ message: 'Failed to add subtask', description: error.message });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-sky-500"></div></div>;
    }

    if (!task || !columns) {
        return <div className="text-center mt-10 text-xl">Task or columns not found.</div>;
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto p-4 pt-20 dark:bg-gray-900 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{task.name} - Subtasks</h1>
                    <button 
                        onClick={() => setShowAddSubTaskModal(true)}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        Add Subtask
                    </button>
                </div>

                {showAddSubTaskModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Subtask</h2>
                            <input 
                                type="text"
                                value={newSubTaskName}
                                onChange={(e) => setNewSubTaskName(e.target.value)}
                                placeholder="Subtask name"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
                            />
                            {/* Simplified: Subtasks inherit assignees from parent or are unassigned by default on creation via this UI */}
                            {/* <select
                                value={selectedAssignee}
                                onChange={(e) => setSelectedAssignee(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Assign to (optional)</option>
                                {assignableUsers.map(email => (
                                    <option key={email} value={email}>{email}</option>
                                ))}
                            </select> */}
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setShowAddSubTaskModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md">Cancel</button>
                                <button onClick={handleAddSubTask} className="px-4 py-2 text-white bg-sky-500 hover:bg-sky-600 rounded-md">Add</button>
                            </div>
                        </div>
                    </div>
                )}

                <DragDropContext onDragEnd={result => onDragEnd(result, columns, setColumns)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(columns).map(([columnId, column]) => (
                            <Droppable droppableId={columnId} key={columnId}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md min-h-[200px] 
                                                    ${snapshot.isDraggingOver ? 'bg-sky-100 dark:bg-sky-700' : ''}`}
                                    >
                                        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{column.name}</h2>
                                        {column.items.map((item, index) => (
                                            <Draggable key={item._id} draggableId={item._id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-3 mb-3 bg-white dark:bg-gray-700 rounded-md shadow hover:shadow-lg transition-shadow 
                                                                    border-l-4 ${item.status === 'done' ? 'border-green-500' : item.status === 'in progress' ? 'border-yellow-500' : 'border-gray-400'} 
                                                                    ${snapshot.isDragging ? 'ring-2 ring-sky-500' : ''}`}
                                                    >
                                                        <p className="text-gray-800 dark:text-gray-100 font-medium">{item.name}</p>
                                                        {/* Add more subtask details here if needed, e.g., assigned user */}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </>
    );
};

export default SubTasksPage;