"use client";

import React from 'react';
import { AiOutlineClose } from 'react-icons/ai'; // Import the close icon

const MembersPopup = ({ isOpen, onClose, onlineMembers, offlineMembers, userInfo }) => {
    if (!isOpen) return null;

    // Combine online and offline users, marking them as online or offline
    const allMembers = [
        ...onlineMembers.map(user => ({ ...user, isOnline: true })),
        ...offlineMembers.map(user => ({ ...user, isOnline: false })),
    ];

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-11/12 max-w-md p-4 rounded-lg shadow-lg overflow-y-auto"
                style={{ maxHeight: '90vh' }} // Allow popup to take up to 90% of the viewport height
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Members</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <AiOutlineClose className="h-6 w-6" />
                    </button>
                </div>

                {/* List of all members */}
                <ul>
                    {allMembers.map(user => (
                        <li
                            key={user._id}
                            className={`flex items-center mt-2 p-4 rounded-lg ${
                                user._id === userInfo._id ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                        >
                            <div className="relative mr-4">
                                <img src={user.profile} alt={user.firstName} className="w-10 h-10 rounded-full" />
                                <span
                                    className={`absolute border-2 border-gray-100 bottom-0 right-0 w-3 h-3 rounded-full ${
                                        user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                    }`}
                                />
                            </div>
                            <div>
                                <span className="block font-medium">
                                    {user.firstName} {user.lastName}
                                    {user._id === userInfo._id && ' (You)'}
                                </span>
                                <span className="block text-sm text-gray-500">{user.email}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MembersPopup;
