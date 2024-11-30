"use client";

import React, { useRef, useEffect, useState } from 'react';
import { AiOutlineClose, AiOutlineUserAdd, AiOutlineLogout } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { socketService } from '../../socket/SocketService';
import SearchedUser from '../../addChat/SearchedUser';

const MembersPopup = ({
    onClose,
    onlineMembers,
    offlineMembers,
    userInfo,
    groupInfo,
    isActive,
}) => {
    const contacts = useSelector((state) => state.contacts);
    const [showUserList, setShowUserList] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [userList, setUserList] = useState([]);
    const [isEditing, setIsEditing] = useState(isActive || false);
    const [groupName, setGroupName] = useState(groupInfo.name || "");
    const [groupDescription, setGroupDescription] = useState(groupInfo.description || "");
    const [groupImage, setGroupImage] = useState(groupInfo.profile || "");
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

    const handleAddUser = (userID) => {
        socket.current.emit("join-user-group", { userID, chatID: groupInfo.chatID });
        setShowUserList(false);
        setSearchQuery("");
    };

    const handleLeaveGroup = () => {
        if (!userInfo || !groupInfo) return;
        socket.current.emit('leave-user-group', { userID: userInfo._id, chatID: groupInfo.chatID }, (response) => {
            console.log(response);
        });
    };

    const handleSaveChanges = () => {
        // Emit updated group info to the server
        socket.current.emit("edit-group", {
            chatID: groupInfo.chatID,
            name: groupName,
            description: groupDescription,
            profile: groupImage,
            editorName: userInfo.firstName + ' ' + userInfo.lastName
        });
        setIsEditing(false);
    };

    const handleImageChange = (e) => {

        const file = e.target.files[0];
        if (file) {
            // Convert image to Base64
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result;
                setGroupImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    function handleUserSelect(data) {
        socket.current.emit('join-user-group', {userID: data._id, chatID: groupInfo.chatID, adderName: userInfo.firstName + ' ' + userInfo.lastName})
        setSearchQuery('')
        setShowUserList(false)
    }

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-11/12 max-w-96 p-4 rounded-lg shadow-lg overflow-y-auto dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                style={{ maxHeight: '90vh' }}
            >
                {isEditing && (
                    <div className='relative'>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 mb-4 absolute right-0"
                        >
                            <AiOutlineClose className="h-6 w-6" />
                        </button>
                        <div className="flex flex-col items-center mb-4">
                            <label className="w-20 h-20 rounded-full overflow-hidden border cursor-pointer">
                                <img
                                    src={groupImage || "images/group-profile.svg"}
                                    alt="Group"
                                    className="w-full h-full object-cover"
                                />
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <input
                            type="text"
                            placeholder="Group Name"
                            className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <textarea
                            placeholder="Group Description"
                            className="w-full p-4 border resize-none border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            rows={4}
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                        />
                        <button
                            onClick={handleSaveChanges}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            Save Changes
                        </button>
                    </div>
                )}

                {showUserList &&
                    <div className='relative flex flex-col gap-3 items-center'>
                        <h2 className='font-bold text-xl my-3'>Added new user</h2>
                        <button className='absolute top-0 right-0' ><AiOutlineClose/></button>

                        <input
                            type="text"
                            className="w-full  p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search user'
                        />

                        <SearchedUser users={userList} searchQuery={searchQuery} onSelectUser={handleUserSelect} />
                    </div>
                }

                {!showUserList && !isEditing && <div>
                            <div className="flex justify-between mb-4">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-gray-700 dark:text-gray-100 px-2 py-1 dark:bg-gray-600 rounded-xl bg-gray-400"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                                >
                                    <AiOutlineClose className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="flex flex-col items-center mb-8">
                                <img
                                    className="w-14 h-14 rounded-full"
                                    src={groupInfo.profile || "images/group-profile.svg"}
                                    alt="Group Icon"
                                />
                                <h2 className="text-lg font-semibold">{groupInfo.name}</h2>
                                <p className="text-gray-500 text-sm dark:text-gray-400">{groupInfo.description}</p>
                            </div>
                            <ul>
                                {allMembers.map(item => {
                                    const user = contacts[item.userID];
                                    if (user)
                                        return (
                                            <li
                                                key={user._id}
                                                className={`flex items-center mt-2 p-4 rounded-lg ${user._id === userInfo._id ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                                                    }`}
                                            >
                                                <div className="relative mr-4">
                                                    <img
                                                        src={user.profile || "images/user-profile.jpg"}
                                                        alt={user.firstName}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <span
                                                        className={`absolute border-2 border-gray-100 bottom-0 right-0 w-3 h-3 rounded-full ${item.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                                            }`}
                                                    />
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-gray-900 dark:text-gray-100">
                                                        {user.firstName} {user.lastName}
                                                        {user._id === userInfo._id && ' (You)'}
                                                    </span>
                                                    <span className="block text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
                                                </div>
                                            </li>
                                        );
                                    else return null;
                                })}
                            </ul>

                            <div className="flex flex-col gap-2 mt-3">
                                <button
                                    onClick={() => setShowUserList(true)}
                                    className="flex items-center justify-center mt-4 w-full py-2 text-blue-500 border border-blue-500 font-semibold rounded-lg shadow-md hover:bg-blue-100 dark:hover:bg-blue-600 dark:text-white"
                                >
                                    <AiOutlineUserAdd className="mr-2 h-5 w-5" />
                                    Add User
                                </button>
                                <button
                                    onClick={handleLeaveGroup}
                                    className="flex items-center justify-center w-full py-2 text-red-500 border border-red-500 font-semibold rounded-lg shadow-md hover:bg-red-100 dark:hover:bg-red-600 dark:text-white"
                                >
                                    <AiOutlineLogout className="mr-2 h-5 w-5" />
                                    Leave Group
                                </button>
                            </div>
                        </div>}


            </div>
        </div>
    );
};

export default MembersPopup;