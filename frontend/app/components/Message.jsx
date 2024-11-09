import React, { useState } from 'react';
import { FaCheck, FaCheckDouble, FaRegClock } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const Message = ({ message, isSentByUser }) => {
    const contacts = useSelector((state) => state.contacts);
    const [showReadByPopup, setShowReadByPopup] = useState(false);
    const userInfo = useSelector((state) => state.user.userInfo);
    const activeChatInfo = useSelector((state) => state.activeChat);

    const togglePopup = () => {
        if (isSentByUser) {
            setShowReadByPopup((prev) => !prev);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <FaCheck className="text-gray-400" />;
            case 'delivered':
                return <FaCheckDouble className="text-gray-400" />;
            case 'read':
                return <FaCheckDouble className="text-green-500" />;
            default:
                return <FaRegClock className='text-gray-400' />;
        }
    };

    const getReadByUsers = () => {
        return message.readBy
            .filter(userId => userId !== userInfo._id)
            .map(userId => contacts[userId])
            .filter(Boolean);
    };

    const getNotReadByUsers = () => {
        const readByIds = new Set([...message.readBy, userInfo._id]);
        return activeChatInfo.members
            .filter(userID => !readByIds.has(userID))
            .map(userId => contacts[userId])
            .filter(Boolean);
    };

    const readByUsers = getReadByUsers();
    const notReadByUsers = getNotReadByUsers();

    function formatTime(epochTime) {
        const date = new Date(epochTime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    

    return (
        <div className={`flex message mb-2  ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
            <div className="rounded relative">
                <div onClick={togglePopup} className={`${isSentByUser ? 'bg-blue-500 text-white cursor-pointer ' : 'bg-gray-200 text-black'} rounded-md flex gap-2 items-end px-3 py-2 `}>
                    <p className={`inline-block `}> {message.text} </p>
                    {isSentByUser && (
                        <span className="text-xs">
                            {getStatusIcon(message.status)}
                        </span>
                    )}
                    <p className='text-xs'>{formatTime(message.sentAt)}</p>
                </div>

                {/* Full-screen popup with translucent background */}
                {isSentByUser && showReadByPopup && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowReadByPopup(false)}
                    >
                        <div
                            className="bg-white border rounded-lg shadow-lg p-5 w-80 max-w-full relative"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
                        >
                            <button
                                onClick={() => setShowReadByPopup(false)}
                                className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-2xl font-bold"
                            >
                                &times;
                            </button>

                            {/* Message Text */}
                            <div className="mb-4 text-left">
                                <p className="text-sm font-semibold text-gray-800 mb-2">Message:</p>
                                <p className="bg-gray-100 text-gray-700 p-2 rounded-md">{message.text}</p>
                            </div>

                            {/* Read by Section */}
                            {readByUsers.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-sm text-gray-700 mb-2 text-left">Read by:</h3>
                                    {readByUsers.map((user) => (
                                        <div key={user._id} className="flex items-center mb-2 space-x-2 p-3 bg-gray-200 rounded-md">
                                            <img
                                                src={user.profile}
                                                alt={user.firstName}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <span className="text-sm">
                                                {user.firstName} {user.lastName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Not read by Section */}
                            {notReadByUsers.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-700 mb-2 text-left">Not read by:</h3>
                                    {notReadByUsers.map((user) => (
                                        <div key={user._id} className="flex items-center mb-2 space-x-2 bg-gray-200 p-3 rounded-md">
                                            <img
                                                src={user.profile}
                                                alt={user.firstName}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <span className="text-sm">
                                                {user.firstName} {user.lastName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;
