import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import NavSearch from './NavSearch';
import MobileSearch from './MobileSearch';
import MobileMenu from './MobileMenu';
import Btn from './Btn';
import { logoutUser } from '../../apiService'; 
import { useNavigate } from 'react-router-dom'


export default function Navbar() {
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const dispatch = useDispatch();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleMobileSearch = () => {
        setIsMobileSearchOpen(!isMobileSearchOpen);
        console.log('Toggle Mobile');
    };

    const handleLogout = async () => {
        console.log('Logout');
        try {
            await logoutUser(); 
            dispatch(logout()); 
            localStorage.removeItem('authToken'); 
            localStorage.removeItem('user'); 
            console.log("hahahah")
            navigate('/login')
        } catch (error) {
            console.log('Logout failed:', error);
        }
    };

    return (
        <>
            <nav className="bg-white border-gray-200 dark:bg-gray-900">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                        Task Tree
                    </span>
                    <div className="flex md:order-2">
                        <NavSearch 
                            toggleMobileSearch={toggleMobileSearch} 
                        />
                        <button
                            onClick={toggleMobileMenu}
                            type="button"
                            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                            aria-controls="navbar-search"
                            aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
                        >
                            <svg
                                className="w-5 h-5"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 17 14"
                            >
                                <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M1 1h15M1 7h15M1 13h15"
                                />
                            </svg>
                        </button>
                        <div className="hidden sm:block" onClick={handleLogout}>
                            <Btn title="Logout" />
                        </div>
                    </div>
                    <MobileSearch 
                        toggleMobileSearch={toggleMobileSearch}
                        isMobileSearchOpen={isMobileSearchOpen} 
                    />
                </div>
            </nav>

            {/* Mobile Menu */}
            <MobileMenu
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={toggleMobileMenu}
                handleLogout={handleLogout}
            />
        </>
    );
}
