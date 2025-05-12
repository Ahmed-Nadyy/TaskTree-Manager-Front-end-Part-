import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedSection } from '../apiService'; // Assuming you have an apiService for fetching data
import SharedSectionNavbar from '../components/SharedSectionNavbar';
import { FaTasks, FaCalendarAlt, FaTag, FaUserCircle, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

const SharedSectionPage = () => {
  const { shareToken } = useParams();
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedSection = async () => {
      try {
        setLoading(true);
        const data = await getSharedSection(shareToken);
        setSection(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching shared section:', err);
        setError(err.response?.data?.error || 'Failed to load shared section. The link may be invalid or expired.');
        setSection(null);
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      fetchSharedSection();
    }
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 dark:bg-slate-900 text-gray-100 dark:text-gray-200 p-4">
        <SharedSectionNavbar />
        <div className="flex flex-col items-center justify-center flex-grow">
          <FaSpinner className="animate-spin text-6xl text-sky-400 dark:text-sky-500 mb-4" />
          <p className="text-2xl text-gray-300 dark:text-gray-400">Loading shared tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 dark:bg-slate-900 text-gray-100 dark:text-gray-200 p-4">
        <SharedSectionNavbar />
        <div className="flex flex-col items-center justify-center flex-grow bg-slate-700 dark:bg-slate-800 bg-opacity-75 p-8 rounded-lg shadow-xl text-center">
          <FaExclamationCircle className="text-6xl text-red-400 dark:text-red-500 mb-6" />
          <h2 className="text-3xl font-bold mb-4 text-red-300 dark:text-red-400">Oops! Something went wrong.</h2>
          <p className="text-xl mb-2 text-gray-300 dark:text-gray-400">{error}</p>
          <p className="text-md text-gray-400 dark:text-gray-500">Please check the link or try again later.</p>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 dark:bg-slate-900 text-gray-100 dark:text-gray-200 p-4">
        <SharedSectionNavbar />
        <div className="flex flex-col items-center justify-center flex-grow">
            <FaExclamationCircle className="text-6xl text-yellow-500 dark:text-yellow-400 mb-4" />
            <p className="text-2xl text-gray-300 dark:text-gray-400">No section data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 dark:bg-slate-900 text-gray-100 dark:text-gray-200">
      <SharedSectionNavbar />
      <div className="container mx-auto p-6 md:p-12">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-500 dark:from-sky-500 dark:to-cyan-600 mb-3">
            {section.name}
          </h1>
          <p className="text-lg text-gray-300 dark:text-gray-400">You are viewing a shared section. To manage tasks, please sign up or log in.</p>
        </header>

        {section.tasks && section.tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {section.tasks.map((task) => (
              <div 
                key={task._id} 
                className={`bg-slate-700 dark:bg-slate-800 bg-opacity-70 p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out border-l-4 ${task.isDone ? 'border-green-500 dark:border-green-600' : 'border-yellow-500 dark:border-yellow-400'}`}
              >
                <h3 className={`text-2xl font-semibold mb-3 ${task.isDone ? 'line-through text-gray-500 dark:text-gray-600' : 'text-sky-300 dark:text-sky-400'}`}>{task.name}</h3>
                {task.description && <p className="text-gray-300 dark:text-gray-400 mb-3 text-sm">{task.description}</p>}
                
                <div className="space-y-2 text-sm mb-4">
                  {task.dueDate && (
                    <div className="flex items-center text-gray-400">
                      <FaCalendarAlt className="mr-2 text-sky-400 dark:text-sky-500" /> 
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center text-gray-400">
                    <FaTasks className="mr-2 text-sky-400 dark:text-sky-500" /> 
                    Status: {task.isDone ? 'Completed' : 'Pending'}
                  </div>
                  {task.priority && (
                     <div className="flex items-center text-gray-400">
                        <span className={`mr-2 h-3 w-3 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        Priority: <span className="capitalize">{task.priority}</span>
                    </div>
                  )}
                </div>

                {task.assignedTo && task.assignedTo.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">ASSIGNED TO:</h4>
                    <div className="flex flex-wrap gap-2">
                      {task.assignedTo.map((assignee, index) => (
                        <div key={index} className="flex items-center bg-slate-600 dark:bg-slate-700 px-2 py-1 rounded-full text-xs text-gray-200 dark:text-gray-300">
                          <FaUserCircle className="mr-1 text-sky-400 dark:text-sky-500" /> {assignee.email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.tags && task.tags.length > 0 && (
                  <div className="mb-3">
                     <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">TAGS:</h4>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="bg-sky-600 dark:bg-sky-700 bg-opacity-50 text-sky-300 dark:text-sky-400 px-2 py-1 rounded-full text-xs font-medium">
                          <FaTag className="inline mr-1" />{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {task.subTasks && task.subTasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-300 dark:text-gray-400 mb-2">Sub-tasks:</h4>
                    <ul className="space-y-1 list-inside">
                      {task.subTasks.map((subtask) => (
                        <li key={subtask._id} className={`text-xs flex items-center ${subtask.isDone ? 'line-through text-gray-500 dark:text-gray-600' : 'text-gray-200 dark:text-gray-300'}`}>
                          <span className={`mr-2 h-2 w-2 rounded-full ${subtask.isDone ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          {subtask.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <FaTasks className="text-5xl text-gray-500 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 dark:text-gray-500">This section currently has no tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedSectionPage;