import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL|| 'http://localhost:5000/api'; // Default to localhost if VITE_API_URL is not set

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, 
}); 

export const registerUser = async (userData) => {
    console.log(API_URL);
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

export const verifyOTP = async ({ userId, otp }) => {
    const response = await apiClient.post('/auth/verify-otp', { userId, otp });
    return response.data;
};

export const resendOTP = async ({ userId }) => {
    const response = await apiClient.post('/auth/resend-otp', { userId });
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const getSections = async (userId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.get(`/sections/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching sections:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch sections. Please try again.');
    }
};

export const addSection = async (sectionData) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.post('/sections', sectionData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding section:', error);
        throw new Error(error.response?.data?.message || 'Failed to add section. Please try again.');
    }
};

export const addTask = async (sectionId, taskData) => {
    try {
        const token = localStorage.getItem('authToken');
        // Ensure all task fields are properly formatted
        const formattedTaskData = {
            name: taskData.name,
            description: taskData.description || '',
            priority: taskData.priority || 'low',
            isImportant: taskData.isImportant || false,
            dueDate: taskData.dueDate || null,
            tags: taskData.tags || [],
            assignedTo: taskData.assignedTo || []
        };

        const response = await apiClient.post(`/tasks/${sectionId}`, formattedTaskData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding task:', error);
        throw new Error(error.response?.data?.message || 'Failed to add task. Please try again.');
    }
};

export const deleteSection = async (sectionId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.delete(`/sections/${sectionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting section:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete section. Please try again.');
    }
};

export const logoutUser = async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data; 
};

export const verifyToken = async () => {
    try {
        const token = localStorage.getItem('authToken'); 
        if (!token) {
            throw new Error("No token found");
        }

        const response = await apiClient.get('/auth/verify', {
            headers: {
                Authorization: `Bearer ${token}`, // Send the token in the header
            },
        });

        console.log(response);
        return response.data;
    } catch (error) {
        console.error("Token verification failed:", error);
        throw error;
    }
};

export const updateTask = async (sectionId, taskId, updates) => {
    try {
        const token = localStorage.getItem('authToken');
        // Ensure all task fields are properly formatted
        const formattedUpdates = {
            ...updates,
            priority: updates.priority || undefined,
            isImportant: updates.isImportant !== undefined ? updates.isImportant : undefined,
            dueDate: updates.dueDate || undefined,
            tags: updates.tags || undefined
        };

        const response = await apiClient.put(`/tasks/${sectionId}/${taskId}`, formattedUpdates, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating task:', error);
        throw new Error(error.response?.data?.message || 'Failed to update task. Please try again.');
    }
};

export const refreshToken = async () => {
    try {
        const response = await apiClient.get('/auth/refresh');
        return response.data.accessToken;
    } catch (error) {
        console.error("Token refresh failed:", error);
        throw error;
    }
};
    
export const deleteTask = async (sectionId, taskId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.delete(`/tasks/${sectionId}/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete task. Please try again.');
    }
};

export const addSubTask = async (sectionId, taskId, subTaskData) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.post(`/subtasks/${sectionId}/${taskId}`, subTaskData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding subtask:', error);
        throw new Error(error.response?.data?.message || 'Failed to add subtask. Please try again.');
    }
};

export const togglePublicView = async (sectionId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.put(`/sections/${sectionId}/toggle-public-view`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling public view:', error);
        throw new Error(error.response?.data?.message || 'Failed to toggle public view. Please try again.');
    }
};

export const updateSubTask = async (sectionId, taskId, subTaskId, updates) => {


    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.put(`/subtasks/${sectionId}/${taskId}/${subTaskId}`, updates, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating subtask:', error);
        throw new Error(error.response?.data?.message || 'Failed to update subtask. Please try again.');
    }
};

export const deleteSubTask = async (sectionId, taskId, subTaskId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.delete(`/subtasks/${sectionId}/${taskId}/${subTaskId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting subtask:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete subtask. Please try again.');
    }
};

// Mark Task as Done or Undone
export const markTaskAsDone = async (sectionId, taskId, isDone = true) => {
    console.log(`Marking task as ${isDone ? 'done' : 'undone'}:`, sectionId, taskId);
    console.log("isDone:", isDone);
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.put(`/tasks/${sectionId}/${taskId}/done`, 
            { isDone },
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        console.log("response:", response);
        return response.data;
    } catch (error) {
        console.error(`Error marking task as ${isDone ? 'done' : 'undone'}:`, error);
        throw new Error(error.response?.data?.message || `Failed to mark task as ${isDone ? 'done' : 'undone'}. Please try again.`);
    }
};

// Mark SubTask as Done
export const markSubTaskAsDone = async (sectionId, taskId, subTaskId) => {
    console.log("Marking subtask as done:", sectionId, taskId, subTaskId);
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.put(`/subtasks/${sectionId}/${taskId}/${subTaskId}/done`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error marking subtask as done:', error);
        throw new Error(error.response?.data?.message || 'Failed to mark subtask as done. Please try again.');
    }
};

// Update Dark Mode Preference
export const updateDarkMode = async (darkMode) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.put('/auth/darkmode', { darkMode }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating dark mode:', error);
        throw new Error(error.response?.data?.message || 'Failed to update dark mode preference. Please try again.');
    }
};

export const assignTask = async (taskId, sectionId, emails) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.post(`/tasks/${taskId}/assign`, { emails, sectionId }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning task:', error);
        throw new Error(error.response?.data?.message || 'Failed to assign task. Please try again.');
    }
};

export const shareSection = async (sectionId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await apiClient.post(`/sections/${sectionId}/share`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error sharing section:', error);
        throw new Error(error.response?.data?.message || 'Failed to share section. Please try again.');
    }
};

export const getSharedSection = async (token) => {
    try {
        const response = await apiClient.get(`/sections/shared/${token}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching shared section:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch shared section. Please try again.');
    }
};

apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const newAccessToken = await refreshToken();
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
            }
        }
        return Promise.reject(error);
    }
);
