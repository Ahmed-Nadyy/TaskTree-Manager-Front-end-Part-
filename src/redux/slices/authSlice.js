import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { verifyToken } from '../../apiService'; // Add this API function

const initialState = {
    isAuthenticated: !!localStorage.getItem('authToken'),
    token: localStorage.getItem('authToken') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
};

export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async (_, { dispatch }) => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const userData = await verifyToken(); // No need to pass token here, it's handled in the API function
            dispatch(loginSuccess({
                user: userData,
                token: token
            }));
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
            localStorage.setItem('authToken', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeAuth.rejected, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
            });
    }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
