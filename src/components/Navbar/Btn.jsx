import React from 'react'
import { useNavigate } from 'react-router-dom'
export default function Btn({title, navigation}) {
    const navigate = useNavigate();
    return (
        <>
            <button type="button" onClick={() => navigate(navigation)} className="text-white ml-4 bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">{title}</button>
        </>
    )
}
