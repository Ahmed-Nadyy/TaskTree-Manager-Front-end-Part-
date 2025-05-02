import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  section: '',
  status: '', // 'all', 'completed', 'incomplete'
  priority: '', // 'all', 'low', 'medium', 'high'
  dueDateRange: {
    startDate: null,
    endDate: null
  },
  tags: [],
  searchTerm: ''
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSection: (state, action) => {
      state.section = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setPriority: (state, action) => {
      state.priority = action.payload;
    },
    setDueDateRange: (state, action) => {
      state.dueDateRange = action.payload;
    },
    setTags: (state, action) => {
      state.tags = action.payload;
    },
    clearFilters: (state) => {
      return initialState;
    },
    clearSearchTerm: (state) => {
      state.searchTerm = '';
    }
  }
});

export const { 
  setSearchTerm, 
  setSection, 
  setStatus, 
  setPriority, 
  setDueDateRange, 
  setTags, 
  clearFilters,
  clearSearchTerm
} = filterSlice.actions;

export default filterSlice.reducer;