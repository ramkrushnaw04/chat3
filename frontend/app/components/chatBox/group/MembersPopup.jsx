"use client";

import React, { useRef, useEffect, useState } from 'react';
import { AiOutlineClose, AiOutlineUserAdd, AiOutlineLogout } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { socketService } from '../../socket/SocketService';

const MembersPopup = ({
    isOpen,
    onClose,
    onlineMembers,
    offlineMembers,
    userInfo,
    groupInfo,
}) => {
    const contacts = useSelector((state) => state.contacts);
    if (!isOpen) return null;
    const [showUserList, setShowUserList] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [userList, setUserList] = useState([]);
    const socket = useRef(null);

    const allMembers = [
        ...onlineMembers.map(user => ({ userID: user, isOnline: true })),
        ...offlineMembers.map(user => ({ userID: user, isOnline: false })),
    ];

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);

    useEffect(() => {
        if (showUserList && searchQuery) {
            socket.current.emit('get-users-from-query', { query: searchQuery }, (response) => {
                setUserList(response);
            });
        }
    }, [searchQuery, showUserList]);


    function handleAddUser(userID, chatID) {
        socket.current.emit("join-user-group", { userID, chatID: groupInfo.chatID });
        setShowUserList(false);
        setSearchQuery("");
    }

    function handleLeaveGroup() {
        if (!userInfo || !groupInfo) return;
        socket.current.emit('leave-user-group', { userID: userInfo._id, chatID: groupInfo.chatID }, (response) => {
            console.log(response);
        });
    }

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-[400px] max-w-[90vw] p-4 rounded-lg shadow-lg overflow-y-auto"
                style={{ maxHeight: '90vh' }}
            >
                {showUserList ? (
                    <div>
                        <button onClick={() => setShowUserList(false)} className="text-gray-500 hover:text-gray-700 mb-4">
                            <AiOutlineClose className="h-6 w-6" />
                        </button>
                        <input
                            type="text"
                            placeholder="Search for people..."
                            className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base mb-4"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <ul>
                            {userList.map(user => (
                                <li key={user._id} className="flex items-center p-4 border-b">
                                    <img src={user.profile} alt={user.firstName} className="w-10 h-10 rounded-full mr-4" />
                                    <div>
                                        <span className="block font-medium">{user.firstName} {user.lastName}</span>
                                        <span className="block text-sm text-gray-500">{user.email}</span>
                                    </div>
                                    <button
                                        onClick={() => handleAddUser(user._id, groupInfo.chatID)}
                                        className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                                    >
                                        Add
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-col mb-8">
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 self-end">
                                <AiOutlineClose className="h-6 w-6" />
                            </button>

                            <div className="flex flex-col items-center justify-center gap-4">
                                <img className="w-14 h-14 rounded-full" src={groupInfo.profile} alt="ICON" />
                                <h2 className="text-lg font-semibold">{groupInfo.name}</h2>
                                <p className="text-gray-500 text-sm">{groupInfo.description}</p>
                            </div>
                        </div>

                        <ul>
                            {allMembers.map(item => {
                                const user = contacts[item.userID];
                                if (user)
                                    return (
                                        <li
                                            key={user._id}
                                            className={`flex items-center mt-2 p-4 rounded-lg ${user._id === userInfo._id ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}
                                        >
                                            <div className="relative mr-4">
                                                <img
                                                    src={user.profile}
                                                    alt={user.firstName}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <span
                                                    className={`absolute border-2 border-gray-100 bottom-0 right-0 w-3 h-3 rounded-full ${item.isOnline ? 'bg-green-500' : 'bg-gray-400'
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
                                    );
                                else return null;
                            })}
                        </ul>

                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={() => setShowUserList(true)}
                                className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                            >
                                <AiOutlineUserAdd className="mr-2 h-5 w-5" />
                                Add User
                            </button>
                            <button
                                onClick={handleLeaveGroup}
                                className="flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                            >
                                <AiOutlineLogout className="mr-2 h-5 w-5" />
                                Leave Group
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MembersPopup;
