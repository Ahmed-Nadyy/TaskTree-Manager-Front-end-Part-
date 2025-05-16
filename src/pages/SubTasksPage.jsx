import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSelector } from 'react-redux';
import { getSections, updateSubTask, addSubTask, deleteSubTask } from '../apiService'; // Assuming addSubTask is available
import Navbar from '../components/Navbar/Navbar';
import { notification } from 'antd';

const SubTasksPage = () => {
    const { sectionId, taskId } = useParams();
    const [section, setSection] = useState(null);
    const [task, setTask] = useState(null);
    const [columns, setColumns] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newSubTaskName, setNewSubTaskName] = useState('');
    const [newSubTaskDescription, setNewSubTaskDescription] = useState('');
    const [newSubTaskDeadline, setNewSubTaskDeadline] = useState('');
    const [newSubTaskPriority, setNewSubTaskPriority] = useState('Medium');
    const [editingSubTask, setEditingSubTask] = useState(null); // For editing
    const [showAddSubTaskModal, setShowAddSubTaskModal] = useState(false);
    // const [assignableUsers, setAssignableUsers] = useState([]); // Removed assignableUsers
    const [selectedAssignee, setSelectedAssignee] = useState(''); // This will now store the email input
    const [showAssigneesModal, setShowAssigneesModal] = useState(false);
    const [currentAssignees, setCurrentAssignees] = useState([]);

    const { user } = useSelector((state) => state.auth);

    const fetchTaskDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            // Pass both user.id and user.email to getSections to properly fetch shared sections
            const sectionsData = await getSections(user.id, user.email);
            const currentSection = sectionsData.find(s => s._id === sectionId);
            if (currentSection) {
                const currentTask = currentSection.tasks.find(t => t._id === taskId);
                if (currentTask) {
                    setSection(currentSection);
                    setTask(currentTask);
                    // setAssignableUsers(currentTask.assignedTo.map(u => u.email)); // Removed this line
                    // Filter subtasks based on user role
                    const subTasks = (currentTask.subTasks || []).filter(st => {
                        const isSectionOwner = currentSection.userId === user.id;
                        const isTaskAssignee = currentTask.assignedTo.some(assignee => assignee.email === user.email);

                        if (isSectionOwner || isTaskAssignee) {
                            return true; // Section owners and task assignees see all subtasks
                        }
                        // For other users (including those only assigned to specific subtasks)
                        return st.assignedTo && st.assignedTo.some(a => a.email === user.email);
                    });
                    setColumns({
                        pending: {
                            name: 'Pending',
                            items: subTasks.filter(st => st.status === 'pending' || !st.status)
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
                notification.error({ message: 'Section or task not found' });
            }
        } catch (error) {
            notification.error({ message: 'Failed to load task details', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [sectionId, taskId, user?.id, user?.email]);

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
            // notification.success({ message: 'Subtask status updated!' });
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
        // if (!selectedAssignee.trim()) { // Make assignee mandatory - REMOVED
        //     notification.error({ message: 'Assignee email cannot be empty.' });
        //     return;
        // }
        // Basic email validation (optional, can be more robust)
        if (selectedAssignee.trim() && !/\S+@\S+\.\S+/.test(selectedAssignee)) { // Only validate if email is provided
            notification.error({ message: 'Please enter a valid email address for the assignee.' });
            return;
        }

        // Check if user has permission to add a subtask
        // Only users assigned to the parent task or who own the section can add subtasks
        const canAddSubtask = 
            // User is assigned to the task
            (task.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)) ||
            // User owns the section
            (section.userId === user.id);


        if (!canAddSubtask) {
            notification.error({ message: 'Permission denied', description: 'You do not have permission to add subtasks to this task. Only users assigned to the task or section owners can add subtasks.' });
            return;
        }

        try {
            const newSubtaskData = {
                name: newSubTaskName,
                description: newSubTaskDescription,
                deadline: newSubTaskDeadline || null,
                priority: newSubTaskPriority,
                // assignedTo: [{ email: selectedAssignee }] // Use the email directly - MODIFIED BELOW
            };
            if (selectedAssignee.trim()) { // Only add assignedTo if email is provided
                newSubtaskData.assignedTo = [{ email: selectedAssignee.trim() }];
            }
            // if (selectedAssignee) { // This check is no longer needed as it's mandatory
            //     newSubtaskData.assignedTo = [{ email: selectedAssignee }];
            // }
            await addSubTask(sectionId, taskId, newSubtaskData);
            setShowAddSubTaskModal(false);
            setNewSubTaskName('');
            setNewSubTaskDescription('');
            setNewSubTaskDeadline('');
            setNewSubTaskPriority('Medium');
            setSelectedAssignee('');
            // notification.success({ message: 'Subtask added successfully!' });
            fetchTaskDetails();
        } catch (error) {
            notification.error({ message: 'Failed to add subtask', description: error.message });
        }
    };

    const handleUpdateSubTask = async () => {
        if (!editingSubTask || !editingSubTask.name.trim()) {
            notification.error({ message: 'Subtask name cannot be empty.' });
            return;
        }

        // Check if user has permission to update this subtask
        const canUpdateSubtask = 
            // User created the subtask
            (editingSubTask.createdBy && editingSubTask.createdBy === user.id) ||
            // User is assigned to the task
            (task.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)) ||
            // User owns the section
            (section.userId === user.id);

        if (!canUpdateSubtask) {
            notification.error({ message: 'Permission denied', description: 'You do not have permission to update this subtask.' });
            return;
        }

        try {
            const { _id, name, description, deadline, priority, assignedTo, status, isDone } = editingSubTask;
            const updatedData = { name, description, deadline, priority, assignedTo, status, isDone };

            await updateSubTask(sectionId, taskId, _id, updatedData);
            setEditingSubTask(null); // Close modal
            // notification.success({ message: 'Subtask updated successfully!' });
            fetchTaskDetails();
        } catch (error) {
            notification.error({ message: 'Failed to update subtask', description: error.message });
        }
    };

    const handleDeleteSubTask = async (subTaskId) => {
        // Find the subtask to check permissions
        const subtask = Object.values(columns)
            .flatMap(column => column.items)
            .find(item => item._id === subTaskId);

        if (!subtask) {
            notification.error({ message: 'Subtask not found' });
            return;
        }

        // Check if user has permission to delete this subtask
        const canDeleteSubtask = 
            // User created the subtask
            (subtask.createdBy && subtask.createdBy === user.id) ||
            // User is assigned to the task
            (task.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)) ||
            // User owns the section
            (section.userId === user.id);

        if (!canDeleteSubtask) {
            notification.error({ message: 'Permission denied', description: 'You do not have permission to delete this subtask.' });
            return;
        }

        try {
            await deleteSubTask(sectionId, taskId, subTaskId);
            // notification.success({ message: 'Subtask deleted successfully!' });
            fetchTaskDetails();
        } catch (error) {
            notification.error({ message: 'Failed to delete subtask', description: error.message });
        }
    };

    const openEditModal = (subTask) => {
        // Check if user has permission to edit this subtask
        const canEditSubtask = 
            // User created the subtask
            (subTask.createdBy && subTask.createdBy === user.id) ||
            // User is assigned to the task
            (task.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)) ||
            // User owns the section
            (section.userId === user.id);

        if (!canEditSubtask) {
            notification.error({ message: 'Permission denied', description: 'You do not have permission to edit this subtask.' });
            return;
        }

        setEditingSubTask({ ...subTask, deadline: subTask.deadline ? new Date(subTask.deadline).toISOString().split('T')[0] : '' });
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Subtasks</h1>
                    {/* Only show Add Subtask button if user is assigned to the task or owns the section */}
                    {((task?.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)) || 
                      (section?.userId === user.id)) && (
                        <button
                            onClick={() => setShowAddSubTaskModal(true)}
                            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-sm transition-colors flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Add Subtask</span>
                        </button>
                    )}
                </div>
                {showAddSubTaskModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Subtask</h2>
                            <input 
                                type="text"
                                value={newSubTaskName}
                                onChange={(e) => setNewSubTaskName(e.target.value)}
                                placeholder="Subtask name"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
                            />
                            <textarea
                                value={newSubTaskDescription}
                                onChange={(e) => setNewSubTaskDescription(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
                                rows="3"
                            ></textarea>
                            <input
                                type="date"
                                value={newSubTaskDeadline}
                                onChange={(e) => setNewSubTaskDeadline(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
                            />
                            <select
                                value={newSubTaskPriority}
                                onChange={(e) => setNewSubTaskPriority(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
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
                            <input 
                                type="email"
                                value={selectedAssignee}
                                onChange={(e) => setSelectedAssignee(e.target.value)}
                                placeholder="Assignee Email (optional)"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
                                // required // HTML5 validation - REMOVED
                            />
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setShowAddSubTaskModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md">Cancel</button>
                                <button onClick={handleAddSubTask} className="px-4 py-2 text-white bg-sky-500 hover:bg-sky-600 rounded-md">Add</button>
                            </div>
                        </div>
                    </div>
                )}

                {editingSubTask && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Edit Subtask</h2>
                                <button onClick={() => setEditingSubTask(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <label htmlFor="editSubtaskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtask Name</label>
                                    <input
                                        id="editSubtaskName"
                                        type="text"
                                        value={editingSubTask.name}
                                        onChange={(e) => setEditingSubTask({ ...editingSubTask, name: e.target.value })}
                                        placeholder="Enter subtask name"
                                        className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2H5a1 1 0 110-2V4zm3 1a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>

                                <div className="relative">
                                    <label htmlFor="editSubtaskDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                    <textarea
                                        id="editSubtaskDescription"
                                        value={editingSubTask.description}
                                        onChange={(e) => setEditingSubTask({ ...editingSubTask, description: e.target.value })}
                                        placeholder="Add a detailed description"
                                        className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                                        rows="3"
                                    ></textarea>
                                    <div className="absolute top-0 left-0 pl-3 pt-10 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2H5a1 1 0 110-2V4zm3 1a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label htmlFor="editSubtaskDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                                        <input
                                            id="editSubtaskDeadline"
                                            type="date"
                                            value={editingSubTask.deadline}
                                            onChange={(e) => setEditingSubTask({ ...editingSubTask, deadline: e.target.value })}
                                            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="editSubtaskPriority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                        <select
                                            id="editSubtaskPriority"
                                            value={editingSubTask.priority}
                                            onChange={(e) => setEditingSubTask({ ...editingSubTask, priority: e.target.value })}
                                            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                        <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 01-.8-1.6L7.75 8l-2.55-3.4A1 1 0 013 4V3a3 3 0 013-3z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative">
                                    <label htmlFor="editAssignTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                                    {/* <select
                                        id="editAssignTo"
                                        value={editingSubTask.assignedTo && editingSubTask.assignedTo.length > 0 ? editingSubTask.assignedTo[0].email : ''}
                                        onChange={(e) => setEditingSubTask({ ...editingSubTask, assignedTo: e.target.value ? [{ email: e.target.value }] : [] })}
                                        className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Assign to (optional)</option>
                                        {assignableUsers.map(email => (
                                            <option key={email} value={email}>{email}</option>
                                        ))}
                                    </select> */}
                                    <input
                                        id="editAssignTo"
                                        type="email"
                                        value={editingSubTask.assignedTo && editingSubTask.assignedTo.length > 0 ? editingSubTask.assignedTo[0].email : ''}
                                        onChange={(e) => setEditingSubTask({ ...editingSubTask, assignedTo: e.target.value ? [{ email: e.target.value.trim() }] : [] })}
                                        placeholder="Assignee Email (optional)"
                                        className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-8">
                                <button onClick={() => handleDeleteSubTask(editingSubTask._id)} className="px-6 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Delete</span>
                                </button>
                                <div className="flex space-x-4">
                                    <button onClick={() => setEditingSubTask(null)} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg shadow-sm transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleUpdateSubTask} className="px-6 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-sm transition-colors flex items-center space-x-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        <span>Save Changes</span>
                                    </button>
                                </div>
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
                                        className={`bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-md min-h-[200px] 
                                                    ${snapshot.isDraggingOver ? 'bg-sky-100 dark:bg-sky-700' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-lg font-semibold text-sky-600 dark:text-sky-400">{column.name}</h2>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                                                {column.items.length}
                                            </span>
                                        </div>
                                        {column.items.map((item, index) => (
                                            <Draggable key={item._id} draggableId={item._id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-4 mb-3 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow 
                                                                    border-l-4 ${item.status === 'done' ? 'border-green-500' : item.status === 'in progress' ? 'border-yellow-500' : 'border-gray-400'} 
                                                                    ${snapshot.isDragging ? 'ring-2 ring-sky-500' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-gray-800 dark:text-gray-100 font-semibold">{item.name}</h3>
                                                            <div className="flex space-x-1">
                                                                {/* Only show edit/delete buttons if user created the subtask, is assigned to the task, or owns the section */}
                                                                {((item.createdBy && item.createdBy === user.id) || 
                                                                  (task.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)) || 
                                                                  (section.userId === user.id)) && (
                                                                    <>
                                                                        <button 
                                                                            onClick={() => openEditModal(item)} 
                                                                            className="p-1.5 bg-sky-100 dark:bg-sky-800 text-sky-600 dark:text-sky-300 rounded hover:bg-sky-200 dark:hover:bg-sky-700 transition-colors"
                                                                            title="Edit subtask"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteSubTask(item._id)} 
                                                                            className="p-1.5 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                                                                            title="Delete subtask"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                            </svg>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                                                        )}
                                                        <div className="space-y-2">
                                                            <div className="flex flex-wrap gap-2 text-xs">
                                                                {item.priority && (
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full
                                                                        ${item.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                                                        item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                                                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                        </svg>
                                                                        {item.priority}
                                                                    </span>
                                                                )}
                                                                {item.deadline && (
                                                                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                        {new Date(item.deadline).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.assignedTo && item.assignedTo.length > 0 && (
                                                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                    {item.assignedTo[0].email}
                                                                    {item.assignedTo.length > 1 && (
                                                                        <button 
                                                                            onClick={() => { setCurrentAssignees(item.assignedTo); setShowAssigneesModal(true); }}
                                                                            className="ml-1 text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 font-medium"
                                                                        >
                                                                            (+{item.assignedTo.length - 1})
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
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