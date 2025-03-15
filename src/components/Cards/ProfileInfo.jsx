import React from 'react'
import SearchBar from '../SearchBar/SearchBar'
import { useNavigate } from 'react-router-dom'
export default function ProfileInfo() {
    const navigate = useNavigate()
    return (
        <>
            <div>
                <h1 className='text-2xl font-bold  text-[#000B58]'>Ted Sys</h1>
            </div>
            <SearchBar />
            <div className='flex items-center gap-2'>
                <p className='text-sm rounded-full bg-[#bfc5ed] text-[#000B58] px-3 py-3 font-bold'>AN</p>
                <button onClick={() => navigate('/login')} className='bg-[#000B58] text-white px-4 py-2 rounded-md hover:bg-[#000B58] hover:scale-105 transition-all duration-300'>Logout</button>
            </div>
            
        </>
    )
}
