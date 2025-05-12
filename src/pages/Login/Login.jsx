import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../apiService';
import { loginSuccess } from '../../redux/slices/authSlice';
import Swal from 'sweetalert2';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const credentials = Object.fromEntries(formData);

        setLoading(true);
        try {
            const response = await loginUser(credentials);
            
            dispatch(loginSuccess({
                user: response.user,
                token: response.accessToken, 
            }));

            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'You have logged in successfully.',
                background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            }).then(() => {
                navigate('/dashboard');
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: error.response?.data?.message || 'An error occurred during login.',
                background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            });
            console.log("Login failed:", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans">
            <div className="relative min-h-screen flex flex-col sm:justify-center items-center bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
                <div className="relative sm:max-w-sm w-full">
                    <div className="card bg-[#000B58] dark:bg-[#1a1a1a] shadow-lg w-full h-full rounded-3xl absolute transform -rotate-6" />
                    <div className="card bg-[#006A67] dark:bg-[#2d2d2d] shadow-lg w-full h-full rounded-3xl absolute transform rotate-6" />
                    <div className="relative w-full rounded-3xl px-6 py-4 bg-gray-100 dark:bg-gray-800 shadow-md transition-colors duration-200">
                        <label className="block mt-3 text-sm text-gray-700 dark:text-gray-300 text-center font-semibold">
                            Login
                        </label>
                        <form className="mt-10" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                className="px-2 mt-1 block w-full border-none bg-gray-100 dark:bg-gray-700 h-11 rounded-xl shadow-lg 
                                    hover:bg-blue-100 dark:hover:bg-gray-600 focus:bg-blue-100 dark:focus:bg-gray-600 focus:ring-0 
                                    text-gray-800 dark:text-gray-200 transition-colors duration-200"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                className="px-2 mt-7 block w-full border-none bg-gray-100 dark:bg-gray-700 h-11 rounded-xl shadow-lg 
                                    hover:bg-blue-100 dark:hover:bg-gray-600 focus:bg-blue-100 dark:focus:bg-gray-600 focus:ring-0 
                                    text-gray-800 dark:text-gray-200 transition-colors duration-200"
                                required
                            />
                            <div className="mt-7 flex justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => Swal.fire('Not Implemented', 'Password recovery is not yet available.', 'info')} 
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline transition-colors duration-200 focus:outline-none"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="mt-7">
                                <button
                                    type="submit"
                                    className={`bg-[#000B58] dark:bg-gray-700 w-full py-3 rounded-xl text-white shadow-xl 
                                        hover:shadow-inner focus:outline-none transition duration-500 ease-in-out transform 
                                        hover:-translate-x hover:scale-105 hover:bg-[#000d6e] dark:hover:bg-gray-600 
                                        ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : null}
                                    {loading ? 'Logging In...' : 'Login'}
                                </button>
                            </div>
                            <div className="flex mt-7 items-center text-center">
                                <hr className="border-gray-300 dark:border-gray-600 border-1 w-full rounded-md" />
                                <label className="block font-medium text-sm text-gray-600 dark:text-gray-400 w-full">
                                    Or log in with
                                </label>
                                <hr className="border-gray-300 dark:border-gray-600 border-1 w-full rounded-md" />
                            </div>
                            <div className="mt-7">
                                <div className="flex justify-center items-center">
                                    <label className="mr-2 text-gray-700 dark:text-gray-300">New user?</label>
                                    <a
                                        href="#"
                                        onClick={() => navigate('/signup')}
                                        className="text-[#000B58] dark:text-blue-400 transition duration-500 ease-in-out transform 
                                            hover:-translate-x hover:scale-105 hover:text-[#000d6e] dark:hover:text-blue-300"
                                    >
                                        Create an Account
                                    </a>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
