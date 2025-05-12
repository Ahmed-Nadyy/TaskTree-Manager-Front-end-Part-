import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { verifyToken } from '../../apiService';

// Helper function to get dark mode from localStorage
const getDarkModeFromStorage = () => {
    const darkMode = localStorage.getItem('darkMode');
    return darkMode === 'true';
};

// Helper function to safely parse JSON
const safeJSONParse = (str) => {
    try {
        return str ? JSON.parse(str) : null;
    } catch (e) {
        console.warn('Failed to parse JSON from localStorage:', e);
        return null;
    }
};

const initialState = {
    isAuthenticated: !!localStorage.getItem('authToken'),
    token: localStorage.getItem('authToken') || null,
    user: safeJSONParse(localStorage.getItem('user')),
    darkMode: getDarkModeFromStorage(),
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,    // string | null
};

export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async (_, { dispatch }) => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {            const response = await verifyToken();
            dispatch(loginSuccess({
                user: response.user,
                token: token
            }));
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
            dispatch(logout());
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            // Preserve the current dark mode setting instead of resetting it
            localStorage.setItem('authToken', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            // Don't reset dark mode on logout
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        },
        toggleDarkMode: (state) => {
            state.darkMode = !state.darkMode;
            localStorage.setItem('darkMode', state.darkMode.toString());
            if (state.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        setDarkMode: (state, action) => {
            state.darkMode = action.payload;
            localStorage.setItem('darkMode', action.payload.toString());
            if (action.payload) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeAuth.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(initializeAuth.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // If initializeAuth was successful due to a valid token,
                // loginSuccess would have been dispatched, setting isAuthenticated and user.
                // If no token, it returns early, and state remains as is (potentially unauthenticated).
            })
            .addCase(initializeAuth.rejected, (state, action) => {
                state.status = 'failed';
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.error = action.error.message || 'Failed to initialize auth';
                // Don't reset dark mode on auth rejection
            });
    }
});

export const { loginSuccess, logout, toggleDarkMode, setDarkMode } = authSlice.actions;
export default authSlice.reducer;
