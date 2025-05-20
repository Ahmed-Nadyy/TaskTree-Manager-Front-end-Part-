import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    getSections, addSection, addTask, deleteSection, updateTask, deleteTask, 
    markTaskAsDone, shareSection, togglePublicView as apiTogglePublicView,
    createWorkspace, getWorkspaces, updateWorkspace, deleteWorkspace, setDefaultWorkspace
} from '../../apiService';
import { setSection } from '../../redux/slices/filterSlice';
import { setWorkspaces, setCurrentWorkspace, addWorkspace, updateWorkspace as updateWorkspaceState, deleteWorkspace as deleteWorkspaceState } from '../../redux/slices/workspaceSlice';
import ProtectedRoute from '../../components/ProtectedRoute.jsx';
import TaskCard from '../../components/HomeComponents/TaskCard.jsx';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import { notification } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faFaceRollingEyes, faShare } from '@fortawesome/free-solid-svg-icons';
import SectionTreeView from '../../components/TreeView/SectionTreeView';
import TaskTreeView from '../../components/TreeView/TaskTreeView';
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
// Add custom animation styles
const animationStyles = `
  @keyframes pulse-slow {
    0% { box-shadow: 0 0 0 0 rgba(17, 24, 39, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(17, 24, 39, 0); }
    100% { box-shadow: 0 0 0 0 rgba(17, 24, 39, 0); }
  }
  .animate-pulse-slow {
    animation: pulse-slow 2s infinite;
  }
`;


export default function Home() {
    const [sections, setSections] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalSectionOpen, setIsModalSectionOpen] = useState(false);
    const [sectionClicked, setSectionClicked] = useState(null);
    const [newSec, setNewSec] = useState({ name: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSections, setIsLoadingSections] = useState(true); // Added for initial load
    const [processingIds, setProcessingIds] = useState([]); // To track IDs of items being processed
    const [currentView, setCurrentView] = useState('home'); // 'home' or 'shared'
    const [sharedSections, setSharedSections] = useState([]);
    const [isLoadingSharedSections, setIsLoadingSharedSections] = useState(false);
    const [newTask, setNewTask] = useState({
        name: "",
        description: "",
        priority: "low",
        isImportant: false,
        dueDate: "",
        tags: [],
        isDone: false,
        assignedTo: []
    });
    const [emailInput, setEmailInput] = useState('');
    const [assignedEmails, setAssignedEmails] = useState([]);
    const [showSectionTreeModal, setShowSectionTreeModal] = useState(false);
    const [sectionClickedd, setSectionClickedd] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            // Auto-collapse sidebar on mobile
            if (window.innerWidth < 768) {
                setIsSidebarCollapsed(true);
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Add animation styles to document head
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = animationStyles + `
            /* Add swipe indicator on mobile */
            .swipe-indicator {
                position: fixed;
                left: 0;
                top: 50%;
                width: 5px;
                height: 50px;
                background-color: rgba(14, 165, 233, 0.7);
                border-radius: 0 4px 4px 0;
                transform: translateY(-50%);
                z-index: 30;
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }
            
            @media (min-width: 768px) {
                .swipe-indicator {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);
    const { isAuthenticated, user, token } = useSelector((state) => state.auth);
    const userRole = user?.role || 'solo';
    const filterState = useSelector((state) => state.filter);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const workspaces = useSelector((state) => state.workspace.workspaces);
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);

    const fetchSharedSectionsAndTasks = async () => {
        if (!user?.id || !token) return;
        setIsLoadingSharedSections(true);
        try {
            // Fetch all sections where the user is assigned to at least one task (from other accounts)
            const allSections = await getSections(user.id, user.email); // Pass email for backend filtering
            // Only include sections NOT owned by the current user
            const filteredShared = allSections
                .filter(section => section.userId !== user.id) // Exclude own sections
                .map(section => {
                    // Find tasks where user is directly assigned to the task
                    const assignedTasks = section.tasks.filter(task =>
                        task.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)
                    );

                    // Find tasks where user is assigned to at least one subtask
                    const tasksWithAssignedSubtasks = section.tasks.filter(task =>
                        task.subTasks && task.subTasks.some(subtask =>
                            subtask.assignedTo && subtask.assignedTo.some(assignee => assignee.email === user.email)
                        )
                    );

                    // Combine both sets of tasks (removing duplicates)
                    const combinedTaskIds = new Set([...assignedTasks, ...tasksWithAssignedSubtasks].map(task => task._id));
                    const allRelevantTasks = section.tasks.filter(task => combinedTaskIds.has(task._id));

                    return {
                        ...section,
                        tasks: allRelevantTasks
                    };
                })
                .filter(section => section.tasks.length > 0); // Only sections with relevant tasks

            setSharedSections(filteredShared);
        } catch (error) {
            console.error("Error fetching shared sections:", error);
            notifyError(error.message || 'Failed to load shared items.');
        } finally {
            setIsLoadingSharedSections(false);
        }
    };

    // Filter tasks based on filter criteria
    const filterTasks = (tasks, sectionId) => {
        if (!tasks) return [];

        return tasks.filter(task => {
            // Filter by section
            if (filterState.section && filterState.section !== sectionId) {
                return false;
            }

            // Filter by status
            if (filterState.status === 'completed' && !task.isDone) {
                return false;
            }
            if (filterState.status === 'incomplete' && task.isDone) {
                return false;
            }

            // Filter by priority
            if (filterState.priority && task.priority !== filterState.priority) {
                return false;
            }

            // Filter by due date range
            if (filterState.dueDateRange.startDate && task.dueDate) {
                const taskDate = new Date(task.dueDate);
                const startDate = new Date(filterState.dueDateRange.startDate);
                if (taskDate < startDate) {
                    return false;
                }
            }

            if (filterState.dueDateRange.endDate && task.dueDate) {
                const taskDate = new Date(task.dueDate);
                const endDate = new Date(filterState.dueDateRange.endDate);
                endDate.setHours(23, 59, 59, 999); // End of the day
                if (taskDate > endDate) {
                    return false;
                }
            }

            // Filter by search term (search in task name and tags)
            if (filterState.searchTerm) {
                const searchLower = filterState.searchTerm.toLowerCase();
                const nameMatch = task.name.toLowerCase().includes(searchLower);
                const tagMatch = task.tags && task.tags.some(tag =>
                    tag.toLowerCase().includes(searchLower)
                );

                if (!nameMatch && !tagMatch) {
                    return false;
                }
            }

            return true;
        });
    };

    // Update sections in FilterComponent when they change
    useEffect(() => {
        if (sections.length > 0) {
            // This would ideally update a global state that FilterComponent can access
            // For now, we'll just make sure the section filter works correctly
            const sectionExists = sections.some(section => section._id === filterState.section);
            if (filterState.section && !sectionExists) {
                dispatch(setSection(''));
            }
        }
    }, [sections, filterState.section, dispatch]);

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
    };    const fetchSections = async (workspaceId) => {
        setIsLoadingSections(true);
        try {
            if (!user?.id || !user?.email) {
                console.log("User ID or email not available for fetching sections", user);
                notifyError("User session error. Please try logging in again.");
                setIsLoadingSections(false);
                return;
            }
            // Pass both user.id and user.email to get all sections including ones shared with the user
            const sectionsData = await getSections(user.id, user.email, workspaceId);
            setSections(sectionsData);
        } catch (error) {
            console.error("Error fetching sections:", error);
            notifyError(error.message || 'Failed to load sections. Please try again.');
        } finally {
            setIsLoadingSections(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        const initialDataFetch = async () => {
            if (!user?.id || !token) {
                notifyError("User session error. Please try logging in again.");
                setIsLoadingSections(false);
                setIsLoadingSharedSections(false);
                return;
            }

            // Fetch data for 'home' view
            setIsLoadingSections(true);
            try {
                const sectionsData = await getSections(user.id, token);
                setSections(sectionsData);
            } catch (error) {
                console.error("Error fetching sections for Home view:", error);
                notifyError(error.message || 'Failed to load home sections. Please try again.');
            } finally {
                setIsLoadingSections(false);
            }

            // Fetch data for 'shared' view
            // The fetchSharedSectionsAndTasks function already sets its own loading state
            await fetchSharedSectionsAndTasks();
        };

        if (isAuthenticated && user?.id) {
            initialDataFetch();
        }

    }, [isAuthenticated, user, token, navigate]); // Removed currentView from dependencies

    const handleTaskIsDone = async (taskId, sectionId, isChecked) => {
        // Store the original sections state for rollback
        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, taskId]); // Add task ID to processing list
        try {
            // Optimistic update
            setSections(prevSections => prevSections.map(section =>
                section._id === sectionId
                    ? {
                        ...section,
                        tasks: section.tasks.map(task =>
                            task._id === taskId ? { ...task, isDone: isChecked } : task
                        ),
                    }
                    : section
            ));

            const updatedTask = await markTaskAsDone(sectionId, taskId, isChecked);
            console.log(`Task marked as ${isChecked ? 'done' : 'undone'}:`, updatedTask);
            notifySuccess(`Task marked as ${isChecked ? 'complete' : 'incomplete'}`);
        } catch (error) {
            // Revert to original state on error
            setSections(originalSections);
            notifyError('Failed to update task status');
            console.error('Error updating task status:', error);
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== taskId)); // Remove task ID
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Are you sure you want to delete this section and all its tasks?')) return;

        // Store original state for rollback
        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, sectionId]); // Add section ID
        try {
            // Optimistic delete
            setSections(prevSections => prevSections.filter(section => section._id !== sectionId));
            await deleteSection(sectionId);
            notifySuccess('Section deleted successfully');
        } catch (error) {
            // Restore original state on error
            setSections(originalSections);
            notifyError('Failed to delete section');
            console.error('Error deleting section:', error);
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== sectionId)); // Remove section ID
        }
    };    const handleCreateSection = async () => {
        if (!newSec.name.trim()) return;

        setIsSubmitting(true);
        const tempId = Date.now().toString();
        const workspaceId = currentWorkspace?._id;
        try {
            // Optimistic create
            const tempSection = {
                _id: tempId,
                name: newSec.name,
                tasks: [],
                userId: user.id,
                workspace: workspaceId
            };
            setSections(prev => [...prev, tempSection]);
            setNewSec({ name: '' });
            setIsModalSectionOpen(false);

            const createdSection = await addSection({ userId: user.id, name: newSec.name, workspaceId });
            // Update with real section data
            setSections(prev => prev.map(section =>
                section._id === tempId ? createdSection : section
            ));
            notifySuccess('Section created successfully');
        } catch (error) {
            // Remove temporary section on error
            setSections(prev => prev.filter(section => section._id !== tempId));
            notifyError('Failed to create section');
            console.error('Error creating section:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateTask = async (sectionId) => {
        if (!newTask.name?.trim()) return;

        setIsSubmitting(true);
        const tempId = Date.now().toString();

        // Format task data with assignments
        const taskData = {
            ...newTask,
            assignedTo: assignedEmails.map(email => ({ email }))
        };

        try {
            // Optimistic create
            const tempTask = {
                _id: tempId,
                ...taskData,
                isDone: false,
                subtaskCount: 0,
                subtaskCompleted: 0
            };

            setSections(prev => prev.map(section =>
                section._id === sectionId
                    ? { ...section, tasks: [...section.tasks, tempTask] }
                    : section
            ));

            // Reset form
            setNewTask({
                name: '',
                description: '',
                priority: 'low',
                isImportant: false,
                dueDate: '',
                tags: [],
                assignedTo: []
            });
            setEmailInput('');
            setAssignedEmails([]);
            setIsModalOpen(false);

            // Send to server and update with real data
            const response = await addTask(sectionId, taskData);
            setSections(prev => prev.map(section =>
                section._id === sectionId
                    ? {
                        ...section,
                        tasks: section.tasks.map(task =>
                            task._id === tempId ? response.task : task
                        )
                    }
                    : section
            ));
            notifySuccess('Task created successfully');
        } catch (error) {
            // Remove temporary task on error
            setSections(prev => prev.map(section =>
                section._id === sectionId
                    ? { ...section, tasks: section.tasks.filter(task => task._id !== tempId) }
                    : section
            ));
            notifyError('Failed to create task');
            console.error('Error creating task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTask = async (taskId, sectionId, updatedData) => {
        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, taskId]); // Add task ID
        try {
            // Optimistic update
            setSections(prevSections =>
                prevSections.map(section =>
                    section._id === sectionId
                        ? {
                            ...section,
                            tasks: section.tasks.map(task =>
                                task._id === taskId
                                    ? { ...task, ...updatedData }
                                    : task
                            )
                        }
                        : section
                )
            );

            const response = await updateTask(sectionId, taskId, updatedData);
            notifySuccess('Task updated successfully');
        } catch (error) {
            // Revert to original state on error
            setSections(originalSections);
            notifyError('Failed to update task');
            console.error('Error updating task:', error);
            throw error; // Re-throw to handle in the component
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== taskId)); // Remove task ID
        }
    };

    const handleDeleteTask = async (taskId, sectionId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, taskId]); // Add task ID
        try {
            // Optimistic delete
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

            await deleteTask(sectionId, taskId);
            notifySuccess('Task deleted successfully');
        } catch (error) {
            // Restore original state on error
            setSections(originalSections);
            notifyError('Failed to delete task');
            console.error('Error deleting task:', error);
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== taskId)); // Remove task ID
        }
    };

    const handleShareSection = async (sectionId) => {
        try {
            const response = await shareSection(sectionId);
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

    const handleTogglePublicView = async (sectionId) => {
        const originalSections = [...sections];
        setProcessingIds(prev => [...prev, sectionId + '-toggle']);
        try {
            // Optimistic update
            setSections(prevSections =>
                prevSections.map(s =>
                    s._id === sectionId ? { ...s, isPubliclyViewable: !s.isPubliclyViewable } : s
                )
            );
            const updatedSection = await apiTogglePublicView(sectionId);
            // Update with actual data from server if needed, though optimistic should be fine
            setSections(prevSections =>
                prevSections.map(s =>
                    s._id === sectionId ? { ...s, isPubliclyViewable: updatedSection.section.isPubliclyViewable } : s
                )
            );
            notifySuccess(`Section visibility updated to ${updatedSection.isPubliclyViewable ? 'public' : 'private'}`);
        } catch (error) {
            setSections(originalSections);
            notifyError('Failed to update section visibility.');
            console.error('Error toggling public view:', error);
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== sectionId + '-toggle'));
        }
    };

    // Fetch workspaces data
    useEffect(() => {
        const fetchWorkspacesData = async () => {
            if (!user?.id) return;
            try {
                const workspacesData = await getWorkspaces(user.id);
                dispatch(setWorkspaces(workspacesData));
                if (workspacesData.length > 0) {
                    const defaultWorkspace = workspacesData.find(w => w.isDefault) || workspacesData[0];
                    dispatch(setCurrentWorkspace(defaultWorkspace));
                }
            } catch (error) {
                console.error('Error fetching workspaces:', error);
                notification.error({
                    message: 'Error',
                    description: 'Failed to load workspaces'
                });
            }
        };
        fetchWorkspacesData();
    }, [user?.id, dispatch]);    const handleWorkspaceChange = async (workspace) => {
        if (!workspace) return;
        
        dispatch(setCurrentWorkspace(workspace));
        setIsLoadingSections(true);
        try {
            // Fetch sections for the selected workspace
            await fetchSections(workspace._id);
            notifySuccess(`Switched to workspace: ${workspace.name}`);
        } catch (error) {
            console.error('Error switching workspace:', error);
            notifyError('Failed to load workspace sections');
        } finally {
            setIsLoadingSections(false);
        }
    };

    const handleNewWorkspace = async (name) => {
        try {
            const newWorkspace = await createWorkspace({ name, userId: user.id });
            dispatch(addWorkspace(newWorkspace));
            notification.success({
                message: 'Success',
                description: 'Workspace created successfully'
            });
        } catch (error) {
            console.error('Error creating workspace:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to create workspace'
            });
        }
    };

    const handleEditWorkspace = async (workspaceId, newName) => {
        try {
            const updatedWorkspace = await updateWorkspace(workspaceId, { name: newName });
            dispatch(updateWorkspaceState(updatedWorkspace));
            notification.success({
                message: 'Success',
                description: 'Workspace updated successfully'
            });
        } catch (error) {
            console.error('Error updating workspace:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to update workspace'
            });
        }
    };

    const handleDeleteWorkspace = async (workspaceId) => {
        try {
            await deleteWorkspace(workspaceId);
            dispatch(deleteWorkspaceState(workspaceId));
            notification.success({
                message: 'Success',
                description: 'Workspace deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting workspace:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to delete workspace'
            });
        }
    };    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            {isMobile && <div className="swipe-indicator" />}
            <Sidebar 
                workspaces={workspaces}
                currentWorkspace={currentWorkspace}
                onWorkspaceChange={handleWorkspaceChange}
                onNewWorkspace={handleNewWorkspace}
                onEditWorkspace={handleEditWorkspace}
                onDeleteWorkspace={handleDeleteWorkspace}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />
            <div className="flex flex-col flex-grow min-w-0">
                <Navbar 
                    currentView={currentView} 
                    setCurrentView={setCurrentView}
                    workspaceName={currentWorkspace?.name || 'TaskTree'}
                />            
                <main className={`flex-1 relative overflow-y-auto p-0 transition-all duration-300 ${isSidebarCollapsed ? 'ml-0 sm:ml-4' : 'ml-0 sm:ml-4'}`}>
                    <div className="max-w-8xl mx-auto px-0">
                    {/* Conditional rendering based on currentView */}
                    {currentView === 'home' && (
                            <>

                                {(isLoadingSections && currentView === 'home') && (
                                    <div className="flex flex-col items-center justify-center h-screen">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                                        <p className="sm:text-2xl text-lg text-gray-700 dark:text-gray-300 mt-4">Loading sections...</p>
                                    </div>
                                )}
                                {!isLoadingSections && currentView === 'home' && sections.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-screen">
                                        <p className="sm:text-2xl text-lg text-gray-700 dark:text-gray-300">You haven't created any sections yet</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalSectionOpen(true)}
                                            className="text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 
                                        focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 
                                        font-medium rounded-full text-sm px-6 py-2 mt-4 transition-all duration-200"
                                        >
                                            Create Section
                                        </button>
                                    </div>
                                )}                            {currentView === 'home' && sections.length > 0 && (
                                    <div className="space-y-8">
                                        {/* Create Section Button */}
                                        <button
                                            type="button"
                                            onClick={() => setIsModalSectionOpen(true)}
                                            className="fixed sm:top-1/3 top-1/4 right-0 bg-gradient-to-r from-gray-800 to-gray-700 
                                                dark:from-gray-700 dark:to-gray-600 opacity-60 hover:opacity-100 focus:opacity-100 
                                                hover:bg-gray-900 dark:hover:bg-gray-800 focus:outline-none focus:ring-4 
                                                focus:ring-gray-300 dark:focus:ring-gray-600 font-medium rounded-l-full text-sm pl-2 py-3 
                                                text-white mb-4 shadow-sm transition-all duration-300 ease-in-out transform hover:-translate-x-1 
                                                hover:shadow-xl group z-50"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 group-hover:hidden">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <div className="hidden group-hover:flex flex-col gap-2 relative px-2">
                                                <span className="font-bold">Create</span>
                                                <span className="font-bold">Section</span>
                                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-full 
                                            bg-blue-400 dark:bg-blue-500 transition-all duration-300 rounded-full"></div>
                                            </div>
                                            <span className="absolute top-1/2 -translate-y-1/2 right-full mr-2 bg-gray-800 dark:bg-gray-700 
                                        text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity 
                                        duration-300 whitespace-nowrap text-xs pointer-events-none">Add new section</span>
                                        </button>
                                        
                                        {/* Sections Grid */}
                                        <div className="grid gap-4">
                                            {sections.map((section) => {
                                                // Filter logic
                                                const filteredTasks = filterTasks(section.tasks, section._id);
                                                
                                                // Only render sections that have matching tasks or when no filters are applied
                                                const hasActiveFilters = filterState.section || filterState.status ||
                                                    filterState.priority || filterState.dueDateRange.startDate ||
                                                    filterState.dueDateRange.endDate || filterState.searchTerm ||
                                                    filterState.tags.length > 0;

                                                // If filters are active and no tasks match, don't render this section
                                                if (hasActiveFilters && filteredTasks.length === 0) {
                                                    return null;
                                                }

                                                return (
                                                    <div key={section._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                                        {showSectionTreeModal && (
                                                            <SectionTreeView
                                                                sectionId={sectionClickedd}
                                                                onClose={() => setShowSectionTreeModal(false)}
                                                            />
                                                        )}
                                                        
                                                        {/* Section Header */}
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">
                                                                {section.name}
                                                            </h2>
                                                            <div className="h-0.5 bg-gray-200 dark:bg-gray-700 flex-grow"></div>
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSections = sections.map(s => ({
                                                                            ...s,
                                                                            isMenuOpen: s._id === section._id ? !s.isMenuOpen : false
                                                                        }));
                                                                        setSections(newSections);
                                                                    }}
                                                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 
                                                                focus:outline-none transition-colors duration-200 p-1 rounded-full"
                                                                    aria-label="Section options"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                    </svg>
                                                                </button>
                                                                {section.isMenuOpen && (
                                                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                                                                        <ul className="py-1">
                                                                            <li>
                                                                                <button                                                                                    onClick={() => {
                                                                                        // Only filter sections belonging to current user
                                                                                        if (section.userId === user.id) {
                                                                                            dispatch(setSection(section._id));
                                                                                            const newSections = sections.map(s => ({
                                                                                                ...s,
                                                                                                isMenuOpen: false
                                                                                            }));
                                                                                            setSections(newSections);
                                                                                            notification.success({
                                                                                                message: 'Filter Applied',
                                                                                                description: `Filtering tasks in "${section.name}" section`,
                                                                                            });
                                                                                        } else {
                                                                                            notification.warning({
                                                                                                message: 'Cannot Filter',
                                                                                                description: 'You can only filter sections that belong to your account'
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                                    </svg>
                                                                                    Filter Section
                                                                                </button>
                                                                            </li>
                                                                            <li>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        // Close the menu first
                                                                                        const newSections = sections.map(s => ({
                                                                                            ...s,
                                                                                            isMenuOpen: false
                                                                                        }));
                                                                                        setSections(newSections);
                                                                                        // Then delete after a short delay to avoid UI glitches
                                                                                        setTimeout(() => handleDeleteSection(section._id), 100);
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                    </svg>
                                                                                    Delete Section
                                                                                </button>
                                                                            </li>
                                                                            {/* Remove role check to show for all users */}
                                                                            <li className="border-t border-gray-200 dark:border-gray-700 my-1"></li>
                                                                            <li>
                                                                                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                                                                    <span>Publicly Viewable</span>
                                                                                    <label htmlFor={`toggle-public-${section._id}`} className="flex items-center cursor-pointer">
                                                                                        <div className="relative">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                id={`toggle-public-${section._id}`}
                                                                                                className="sr-only"
                                                                                                checked={section.isPubliclyViewable || false}
                                                                                                onChange={() => handleTogglePublicView(section._id)}
                                                                                                disabled={processingIds.includes(section._id + '-toggle')}
                                                                                            />
                                                                                            <div className={`block w-10 h-6 rounded-full transition-colors ${section.isPubliclyViewable ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${section.isPubliclyViewable ? 'translate-x-full' : ''}`}></div>
                                                                                        </div>
                                                                                    </label>
                                                                                </div>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Section Content */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between gap-4 mb-4">
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setIsModalOpen(true);
                                                                            setSectionClicked(section._id);
                                                                        }}
                                                                        className="text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 
                                                        focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 
                                                        font-medium rounded-lg text-sm sm:px-6 px-3 py-2 transition-colors duration-200 flex items-center"
                                                                    >
                                                                        <span className="sm:block hidden">Create Task</span>
                                                                        <span className="sm:hidden block">+ Task</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setShowSectionTreeModal(true);
                                                                            setSectionClickedd(section._id);
                                                                        }}
                                                                        className="text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 
                                                        focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 
                                                        font-medium rounded-lg text-sm sm:px-6 px-3 py-2 transition-colors duration-200 flex items-center"
                                                                        title="View Section Tree"
                                                                    >
                                                                        
                                                                        <FontAwesomeIcon icon={faProjectDiagram} className="block" />
                                                                    </button>
                                                                </div>

                                                                {/* Remove role check to show share button for all users */}
                                                                <div className="flex justify-center items-center">
                                                                    <button
                                                                        onClick={() => handleShareSection(section._id)}
                                                                        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 
                                                            focus:outline-none focus:ring-2 focus:ring-blue-300 
                                                            font-medium rounded-lg text-sm px-4 py-2 transition-colors duration-200"
                                                                        title="Share Section"
                                                                    >
                                                                        <FontAwesomeIcon icon={faShare} />
                                                                        <span className="hidden sm:inline">Share</span>
                                                                    </button>
                                                                    {section.isPubliclyViewable ? 
                                                                        <span className="text-green-700 dark:text-green-500 font-bold" title="Section is publicly viewable">
                                                                            <FontAwesomeIcon icon={faEye} />
                                                                        </span> : 
                                                                        <span className="text-red-700 dark:text-red-500 font-bold" title="Section is private">
                                                                            <FontAwesomeIcon icon={faEyeSlash} />
                                                                        </span>
                                                                    }
                                                                </div>
                                                            </div>
                                                            <TaskCard
                                                                tasks={filteredTasks}
                                                                handleIsDone={handleTaskIsDone}
                                                                userId={section.userId}
                                                                section={section}
                                                                handleUpdateTask={handleUpdateTask}
                                                                handleDeleteTask={handleDeleteTask}
                                                                processingIds={processingIds} // Pass down processing IDs
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                    {/* Shared View Content */}                    {currentView === 'shared' && (
                        <div className="space-y-8">
                            {isLoadingSharedSections && (
                                <div className="flex flex-col items-center justify-center h-screen">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                                    <p className="sm:text-2xl text-lg text-gray-700 dark:text-gray-300 mt-4">Loading shared sections...</p>
                                </div>
                            )}
                            {!isLoadingSharedSections && sharedSections.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-screen">
                                    <FontAwesomeIcon icon={faFaceRollingEyes} className="text-5xl text-gray-400 dark:text-gray-500 mb-4" />
                                    <p className="sm:text-2xl text-lg text-gray-700 dark:text-gray-300">Nothing is shared with you yet, or no tasks assigned to you in shared sections.</p>
                                </div>
                            )}
                            {!isLoadingSharedSections && sharedSections.length > 0 && sharedSections.map((section) => {
                                const filteredTasks = filterTasks(section.tasks, section._id);
                                // In shared view, we only show tasks assigned to the current user or if the section is public
                                const tasksForCurrentUser = section.tasks.filter(task =>
                                    (task.assignedTo && task.assignedTo.some(assignee => assignee.email === user.email)) || section.isPubliclyViewable
                                );

                                if (tasksForCurrentUser.length === 0 && !section.isPubliclyViewable) return null; // Skip section if no relevant tasks for shared view

                                return (
                                    <div key={`shared-${section._id}`} className="block mt-8">
                                        <div className="flex gap-4 justify-center items-center ml-4">
                                            <h2 className="sm:text-lg font-bold mb-4 min-w-[100px] text-gray-900 dark:text-gray-100">
                                                {section.name} {section.isPubliclyViewable && <FontAwesomeIcon icon={faEye} className="ml-2 text-blue-500" title="Publicly Viewable" />}
                                            </h2>
                                            <div className="sm:w-[100%] w-[80%] h-0.5 bg-gray-800 dark:bg-gray-700"></div>
                                            {/* No section menu or create task button in shared view for simplicity, can be added if needed */}
                                        </div>
                                        {tasksForCurrentUser.length > 0 ? (
                                            <TaskCard
                                                tasks={filterTasks(tasksForCurrentUser, section._id)} // Apply filters to relevant tasks
                                                handleIsDone={handleTaskIsDone} // Potentially disable or modify for shared tasks
                                                userId={section.userId} // This might be the section owner's ID
                                                section={section}
                                                handleUpdateTask={handleUpdateTask} // Potentially disable or modify
                                                handleDeleteTask={handleDeleteTask} // Potentially disable or modify
                                                processingIds={processingIds}
                                                isSharedView={true} // Add a prop to TaskCard if different behavior is needed
                                            />
                                        ) : section.isPubliclyViewable && tasksForCurrentUser.length === 0 ? (
                                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">This public section has no tasks assigned to you.</p>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}


                    {/* Create Task Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 px-4">
                            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Create a New Task</h2>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCreateTask(sectionClicked);
                                }}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Task Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newTask.name || ''}
                                            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
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
                                            value={newTask.description || ''}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
                                            value={newTask.priority || 'low'}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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
                                            value={newTask.dueDate || ''}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                                dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="flex items-center text-gray-700 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={newTask.isImportant || false}
                                                onChange={(e) => setNewTask({ ...newTask, isImportant: e.target.checked })}
                                                className="mr-2 dark:bg-gray-800 dark:border-gray-700"
                                            />
                                            <span className="text-sm font-medium">Mark as Important</span>
                                        </label>
                                    </div>                                <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tags (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={newTask.tags ? newTask.tags.join(', ') : ''}
                                            onChange={(e) => setNewTask({
                                                ...newTask,
                                                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                                            })}
                                            placeholder="Enter tags, separated by commas"
                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500
                                                dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                        />
                                    </div>

                                    {(userRole === 'team' || userRole === 'company') && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Assign to Team Members
                                            </label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="email"
                                                    value={emailInput}
                                                    onChange={(e) => setEmailInput(e.target.value)}
                                                    placeholder="Enter team member's email"
                                                    className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (emailInput && emailInput.includes('@')) {
                                                            if (!assignedEmails.includes(emailInput)) {
                                                                setAssignedEmails([...assignedEmails, emailInput]);
                                                                setNewTask({
                                                                    ...newTask,
                                                                    assignedTo: [...(newTask.assignedTo || []), { email: emailInput }]
                                                                });
                                                                setEmailInput('');
                                                            }
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {assignedEmails.map((email, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                                                    >
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAssignedEmails(assignedEmails.filter(e => e !== email));
                                                                setNewTask({
                                                                    ...newTask,
                                                                    assignedTo: newTask.assignedTo.filter(user => user.email !== email)
                                                                });
                                                            }}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button" onClick={() => {
                                                setIsModalOpen(false);
                                                setNewTask({
                                                    name: '',
                                                    description: '',
                                                    priority: 'low',
                                                    isImportant: false,
                                                    dueDate: '',
                                                    tags: [],
                                                    assignedTo: []
                                                });
                                                setEmailInput('');
                                                setAssignedEmails([]);
                                            }}
                                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className={`px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <svg className="animate-spin h-5 w-5 mr-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : null}
                                            Create Task
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Create Section Modal */}
                    {isModalSectionOpen && (
                        <div className="fixed w-full inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 px-4">
                            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
                                <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Create a New Section</h2>
                                <input
                                    type="text"
                                    placeholder="Section Name"
                                    value={newSec.name}
                                    onChange={(e) =>
                                        setNewSec({ ...newSec, name: e.target.value })
                                    }
                                    className="w-full mb-4 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                        border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none 
                                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                />
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setIsModalSectionOpen(false)}
                                        className="text-gray-700 dark:text-gray-300 px-4 py-2 mr-2 rounded-lg 
                                            hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateSection}
                                        className={`text-white bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <svg className="animate-spin h-5 w-5 mr-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : null}
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </main>
            </div>
        </div>
    );
}
