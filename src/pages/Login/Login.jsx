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
            }).then(() => {
                navigate('/dashboard');
            });
            console.log(response);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: error.response?.data?.message || 'An error occurred during login.',
            });
            console.log("Login failed:", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans">
            <div className="relative min-h-screen flex flex-col sm:justify-center items-center bg-gray-100">
                <div className="relative sm:max-w-sm w-full">
                    <div className="card bg-[#000B58] shadow-lg w-full h-full rounded-3xl absolute transform -rotate-6" />
                    <div className="card bg-[#006A67] shadow-lg w-full h-full rounded-3xl absolute transform rotate-6" />
                    <div className="relative w-full rounded-3xl px-6 py-4 bg-gray-100 shadow-md">
                        <label className="block mt-3 text-sm text-gray-700 text-center font-semibold">
                            Login
                        </label>
                        <form className="mt-10" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                className="px-2 mt-1 block w-full border-none bg-gray-100 h-11 rounded-xl shadow-lg hover:bg-blue-100 focus:bg-blue-100 focus:ring-0"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                className="px-2 mt-7 block w-full border-none bg-gray-100 h-11 rounded-xl shadow-lg hover:bg-blue-100 focus:bg-blue-100 focus:ring-0"
                                required
                            />
                            <div className="mt-7 flex">
                                <a className="w-full text-right underline text-sm text-gray-600 hover:text-gray-900" href="#">
                                    Forgot Password?
                                </a>
                            </div>
                            <div className="mt-7">
                                <button
                                    type="submit"
                                    className={`bg-[#000B58] w-full py-3 rounded-xl text-white shadow-xl hover:shadow-inner focus:outline-none transition duration-500 ease-in-out transform hover:-translate-x hover:scale-105 ${loading ? 'cursor-not-allowed' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Logging In...' : 'Login'}
                                </button>
                            </div>
                            <div className="flex mt-7 items-center text-center">
                                <hr className="border-gray-300 border-1 w-full rounded-md" />
                                <label className="block font-medium text-sm text-gray-600 w-full">
                                    Or log in with
                                </label>
                                <hr className="border-gray-300 border-1 w-full rounded-md" />
                            </div>
                            <div className="mt-7">
                                <div className="flex justify-center items-center">
                                    <label className="mr-2">New user?</label>
                                    <a
                                        href="#"
                                        onClick={() => navigate('/signup')}
                                        className="text-[#000B58] transition duration-500 ease-in-out transform hover:-translate-x hover:scale-105"
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
