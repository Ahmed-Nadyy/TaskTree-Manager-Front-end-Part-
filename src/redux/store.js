// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import filterReducer from './slices/filterSlice';
import displayReducer from './slices/displaySlice';

// Configure the Redux store
const store = configureStore({
    reducer: {
        auth: authReducer,
        filter: filterReducer,
        display: displayReducer
    },
});

export default store;
