import { faPenNib, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export default function TaskCard({ tasks, handleIsDone, userId, section, handleUpdateTask, handleDeleteTask }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className={`${task.isDone ? "bg-green-200" : "bg-white"
                        } shadow-md p-4 rounded-md hover:shadow-lg transition`}
                    onClick={() => { console.log(task._id, section._id); }}
                >
                    <div className="flex justify-between sm:mb-0 mb-3">
                        <h2 className="sm:text-xl text-lg font-semibold text-gray-800">{task.name}</h2>
                        <span className="flex items-center justify-center gap-4" >
                            <label className="flex cursor-pointer">
                                done?
                                <input
                                    type="checkbox"
                                    className="ml-2"
                                    checked={task.isDone}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (window.confirm(`Are you sure you want to mark this task as ${checked ? 'done' : 'undone'}?`)) {
                                            handleIsDone(task._id, section._id, checked);
                                        }
                                    }}
                                />
                            </label>
                            {/* Update Task Button */}
                            {/* <button
                                onClick={() => handleUpdateTask(task)}
                                className=" text-blue-500 hover:underline"
                            >
                                <FontAwesomeIcon icon={faPenNib} />
                            </button> */}
                            {/* Delete Task Button */}
                            <button
                                onClick={() => handleDeleteTask(task._id, section._id)}
                                className=" text-red-500 hover:underline"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </span>
                    </div>
                    <p className="text-gray-600">{task.description}</p>
                    <a
                        href={`/task/${userId}/${section._id}/${task._id}`}
                        className="text-blue-500 hover:underline mt-2 block"
                    >
                        View Task
                    </a>


                </div>
            ))}
        </div>
    );
}
