import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Store section display preferences by section ID
  sectionDisplayMode: {}
};

const displaySlice = createSlice({
  name: 'display',
  initialState,
  reducers: {
    // Toggle between horizontal and vertical display for a specific section
    toggleSectionDisplayMode: (state, action) => {
      const sectionId = action.payload;
      // If the section doesn't have a display mode yet, default to horizontal
      // Otherwise toggle between 'horizontal' and 'vertical'
      state.sectionDisplayMode[sectionId] = 
        state.sectionDisplayMode[sectionId] === 'horizontal' ? 'vertical' : 'horizontal';
    },
    // Set a specific display mode for a section
    setSectionDisplayMode: (state, action) => {
      const { sectionId, mode } = action.payload;
      state.sectionDisplayMode[sectionId] = mode;
    },
    // Reset all section display preferences
    resetDisplayPreferences: (state) => {
      state.sectionDisplayMode = {};
    }
  }
});

export const { 
  toggleSectionDisplayMode, 
  setSectionDisplayMode,
  resetDisplayPreferences 
} = displaySlice.actions;

export default displaySlice.reducer;