import React from 'react'
import NavLogoutBtn from './Btn'
import Btn from './Btn'

export default function MobileMenu({ isMobileMenuOpen, toggleMobileMenu, handleLogout }) {
    return (
        <>
            <div
                className={`fixed top-0 right-0 h-full bg-gray-800 text-white shadow-lg transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    } transition-transform duration-300 ease-in-out w-64 z-50`}
            >
                <div className="p-4">
                    <button
                        onClick={toggleMobileMenu}
                        className="text-white hover:text-gray-300 focus:outline-none"
                    >
                        X
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div onClick={handleLogout}>
                        <Btn title="Logout" />
                    </div>
                </div>
            </div>
        </>
    )
}
