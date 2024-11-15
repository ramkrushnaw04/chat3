import React, { useState } from 'react';
import { FaCheck, FaCheckDouble, FaRegClock, FaFilePdf, FaVideo, FaFileImage, FaFileAudio, FaDownload, FaEye } from 'react-icons/fa'; // Add the icons you need
import { useSelector } from 'react-redux';

const Message = ({ message, isSentByUser, prevMessageSenderID }) => {
    const contacts = useSelector((state) => state.contacts);
    const [showReadByPopup, setShowReadByPopup] = useState(false);
    const userInfo = useSelector((state) => state.user.userInfo);
    const activeChatInfo = useSelector((state) => state.activeChat);

    const togglePopup = () => {
        setShowReadByPopup((prev) => !prev);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <FaCheck className="text-white-400" />;
            case 'delivered':
                return <FaCheckDouble className="text-white-400" />;
            case 'read':
                return <FaCheckDouble className="text-white-500" />;
            default:
                return <FaRegClock className='text-white-400' />;
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

    const isImageFile = message.file && message.file.type.startsWith('image');
    const isPdfFile = message.file && message.file.type === 'application/pdf';
    const isAudioFile = message.file && message.file.type.startsWith('audio');
    const isVideoFile = message.file && message.file.type.startsWith('video');

    const getFileIcon = () => {
        if (isPdfFile) return <FaFilePdf className="text-white" />;
        else if (isAudioFile) return <FaFileAudio className="text-white" />;
        else if (isVideoFile) return <FaVideo className="text-white" />;
        return <FaFileImage className="text-gray-500" />;
    };

    // Function to handle download
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = message.file.content;
        link.download = message.file.name;
        link.click();
    };

    // Function to handle view
    const handleView = () => {
        window.open(message.file.content, '_blank');
    };

    return (
        <div className={`flex w-full message mb-2 ${isSentByUser ? 'justify-end' : 'justify-start'} group gap-2 items-center`}>
            {/* Buttons for download and view (visible on hover) */}
            {/* show buttons to the left */}
            {message.file && isSentByUser && <div className="hidden group-hover:flex gap-2 h-fit">
                <button onClick={handleDownload} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                    <FaDownload />
                </button>
                <button onClick={handleView} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                    <FaEye />
                </button>
            </div>}

            <div className="rounded relative max-w-[90%]">
                <div onClick={togglePopup} className={`${isSentByUser ? 'bg-blue-500 text-white cursor-pointer ' : 'bg-gray-200 text-black'} rounded-md flex gap-2 items-center px-2 py-2`}>
                    {/* user profile */}
                    {!isSentByUser && activeChatInfo.type === 'group' && (
                        <div className="flex-shrink-0 mr-2 ">
                            <img
                                src={contacts[message.senderID]?.profile}
                                alt="ICON"
                                className="w-8 h-8 rounded-full"
                            />
                        </div>
                    )}
                    <div className="flex items-end flex-col">
                        {/* Display the image file if it's an image */}
                        {isImageFile && (
                            <img
                                src={message.file.content}
                                alt="Message media"
                                className="max-w-[250px] rounded-md border border-gray-300 mb-2"
                            />
                        )}

                        {/* Display an icon for non-image files */}
                        {!isImageFile && message.file && (
                            <div className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md mb-2">
                                {getFileIcon()}
                            </div>
                        )}

                        {/* text in the message, only show if text exists */}
                        {message.text && (
                            <p className={`inline-block w-full mb-1 ${isSentByUser ? 'text-end' : 'text-start'}`}>{message.text}</p>
                        )}

                        {/* message delivery status and sending time */}
                        <div className='flex gap-2 ml-2 text-[0.60rem]'>
                            {isSentByUser && (<span > {getStatusIcon(message.status)} </span>)}
                            <p>{formatTime(message.sentAt)}</p>
                        </div>
                    </div>
                </div>


                {/* Full-screen popup with translucent background */}
                {showReadByPopup && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowReadByPopup(false)}
                    >
                        <div
                            className="bg-white border rounded-lg shadow-lg p-5 w-80 max-w-full relative"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
                        >
                            {/* cross button */}
                            <button
                                onClick={() => setShowReadByPopup(false)}
                                className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-2xl font-bold"
                            >
                                &times;
                            </button>

                            {/* Display File Type in the Popup */}
                            {isImageFile && (
                                <img
                                    src={message.file.content}
                                    alt="Message media"
                                    className="max-w-[250px] rounded-md border border-gray-300 mb-2 m-auto mt-8"
                                />
                            )}

                            {/* Message Text */}
                            {message.text && <div className="mb-4 text-left">
                                <p className="text-sm font-semibold text-gray-800 mb-2">Message:</p>
                                <p className="bg-gray-100 text-gray-700 p-2 rounded-md">{message.text}</p>
                            </div>}

                            {/* Read by Section */}
                            {readByUsers.length > 0 && isSentByUser && (
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
                            {notReadByUsers.length > 0 && isSentByUser && (
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

            {/* show buttons to the right */}
            {message.file && !isSentByUser && <div className="hidden group-hover:flex gap-2 h-fit">
                <button onClick={handleDownload} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                    <FaDownload />
                </button>
                <button onClick={handleView} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                    <FaEye />
                </button>
            </div>}
        </div>
    );
};

export default Message;
