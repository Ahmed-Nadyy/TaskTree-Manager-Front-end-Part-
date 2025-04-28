import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../apiService'; 
import Swal from 'sweetalert2';

export default function SignUp() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Passwords do not match!',
                background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await registerUser({ name, email, password });
            console.log(response);
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: 'Your account has been created successfully. You can now log in.',
                background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            }).then(() => {
                navigate('/login');
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'An Error Occurred',
                text: 'Account creation failed. Please try again.',
                background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            });
            console.log(error);
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
                            Create a New Account
                        </label>
                        <form method="#" action="#" className="mt-10" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                className="px-2 mt-1 block w-full border-none bg-gray-100 dark:bg-gray-700 h-11 rounded-xl shadow-lg 
                                    hover:bg-blue-100 dark:hover:bg-gray-600 focus:bg-blue-100 dark:focus:bg-gray-600 focus:ring-0 
                                    text-gray-800 dark:text-gray-200 transition-colors duration-200"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                className="px-2 mt-7 block w-full border-none bg-gray-100 dark:bg-gray-700 h-11 rounded-xl shadow-lg 
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
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                className="px-2 mt-7 block w-full border-none bg-gray-100 dark:bg-gray-700 h-11 rounded-xl shadow-lg 
                                    hover:bg-blue-100 dark:hover:bg-gray-600 focus:bg-blue-100 dark:focus:bg-gray-600 focus:ring-0 
                                    text-gray-800 dark:text-gray-200 transition-colors duration-200"
                                required
                            />
                            <div className="mt-7">
                                <button
                                    type="submit"
                                    className={`bg-[#000B58] dark:bg-gray-700 w-full py-3 rounded-xl text-white shadow-xl 
                                        hover:shadow-inner focus:outline-none transition duration-500 ease-in-out transform 
                                        hover:-translate-x hover:scale-105 hover:bg-[#000d6e] dark:hover:bg-gray-600 
                                        ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Registering...' : 'Create Account'}
                                </button>
                            </div>
                            <div className="flex mt-7 items-center text-center">
                                <hr className="border-gray-300 dark:border-gray-600 border-1 w-full rounded-md" />
                                <label className="block font-medium text-sm text-gray-600 dark:text-gray-400 w-full">
                                    Sign Up With
                                </label>
                                <hr className="border-gray-300 dark:border-gray-600 border-1 w-full rounded-md" />
                            </div>
                            <div className="mt-7">
                                <div className="flex justify-center items-center">
                                    <label className="mr-2 text-gray-700 dark:text-gray-300">Already have an account?</label>
                                    <a
                                        href="#"
                                        onClick={() => navigate('/login')}
                                        className="text-[#000B58] dark:text-blue-400 transition duration-500 ease-in-out transform 
                                            hover:-translate-x hover:scale-105 hover:text-[#000d6e] dark:hover:text-blue-300"
                                    >
                                        Log In
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
