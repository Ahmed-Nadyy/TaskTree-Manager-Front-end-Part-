import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    error: null
};

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState,
    reducers: {
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload;
            if (!state.currentWorkspace && action.payload.length > 0) {
                state.currentWorkspace = action.payload.find(w => w.isDefault) || action.payload[0];
            }
        },
        setCurrentWorkspace: (state, action) => {
            state.currentWorkspace = action.payload;
        },
        addWorkspace: (state, action) => {
            state.workspaces.push(action.payload);
        },
        updateWorkspace: (state, action) => {
            const index = state.workspaces.findIndex(w => w._id === action.payload._id);
            if (index !== -1) {
                state.workspaces[index] = action.payload;
                if (state.currentWorkspace?._id === action.payload._id) {
                    state.currentWorkspace = action.payload;
                }
            }
        },
        deleteWorkspace: (state, action) => {
            state.workspaces = state.workspaces.filter(w => w._id !== action.payload);
            if (state.currentWorkspace?._id === action.payload) {
                state.currentWorkspace = state.workspaces.find(w => w.isDefault) || state.workspaces[0];
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setLoading,
    setError
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
