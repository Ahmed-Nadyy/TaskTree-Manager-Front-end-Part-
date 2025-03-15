import axios from 'axios';
import { loginSuccess, logoutSuccess } from '../reducers/authReducer';

export const login = (email, password) => async (dispatch) => {
    try {
        const { data } = await axios.post('/api/auth/login', { email, password });
        dispatch(loginSuccess(data)); // {id, name, email, token}
        localStorage.setItem('authToken', data.token); // Store token for persistence
    } catch (error) {
        console.error("Login failed:", error.response?.data?.message || error.message);
    }
};

export const logout = () => (dispatch) => {
    localStorage.removeItem('authToken'); // Clear token
    dispatch(logoutSuccess());
};
