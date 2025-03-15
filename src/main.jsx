import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import App from './App';
import { initializeAuth } from './redux/slices/authSlice';
import './index.css';

// Initialize authentication state
store.dispatch(initializeAuth());

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);