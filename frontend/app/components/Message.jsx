import React, { useEffect, useRef, useState } from 'react';
import {
    FaCheck, FaCheckDouble, FaRegClock, FaFilePdf, FaVideo, FaFileImage,
    FaFileAudio, FaDownload, FaEye, FaReply, 
} from 'react-icons/fa';
import { AiOutlineDelete, AiOutlineFile } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from './socket/SocketService';
import { setReplyingToMessage } from '../store/slices/messagesSlice';


const Message = ({ message, isSentByUser, prevMessageSenderID }) => {
    const contacts = useSelector((state) => state.contacts);
    const [showReadByPopup, setShowReadByPopup] = useState(false);
    const userInfo = useSelector((state) => state.user.userInfo);
    const activeChatInfo = useSelector((state) => state.activeChat);
    const socket = useRef(null)
    const dispatch = useDispatch()

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()

        

    }, [])

    const togglePopup = () => {
        setShowReadByPopup((prev) => !prev);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <FaCheck className="text-white" />;
            case 'delivered':
                return <FaCheckDouble className="text-white" />;
            case 'read':
                return <FaCheckDouble className="text-white" />;
            default:
                return <FaRegClock className='text-white' />;
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
    const isOtherFile = message.file && message.file.type === ''

    const getFileIcon = () => {
        if (isPdfFile) return <FaFilePdf className="text-pink-600" />;
        else if (isAudioFile) return <FaFileAudio className="text-blue-600" />;
        else if (isVideoFile) return <FaVideo className="text-green-600" />;
        return <AiOutlineFile className="text-yellow-500" />;
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

    function handleDelete() {
        socket.current.emit('message-delete', { messageID: message._id, chatID: activeChatInfo.chatID })
    }

    function handleMessageReply() {
        dispatch(setReplyingToMessage(message))
    }

    // Render the replied-to message if it exists
    const renderRepliedToMessage = () => {
        if (!message.repliedTo) return null;

        const repliedMessage = message.repliedTo; 

        return (
            <div className={`border-l-4 flex gap-2 items-center ${isSentByUser ? 'border-pink-500' : ' border-blue-500'} bg-gray-100 p-2 mb-2 rounded-md text-sm text-gray-900`}>
                {repliedMessage.file && repliedMessage.file.type.startsWith('image') && (
                    <img
                        src={repliedMessage.file.content}
                        alt="Replied message media"
                        className="w-10 h-10 rounded-md mb-1"
                    />
                )}
                {repliedMessage.text && (
                    <p className="truncate">{repliedMessage.text}</p>
                )}
            </div>
        );
    };

    return (
        <div className={`flex w-full message mb-2 ${isSentByUser ? 'justify-end' : 'justify-start'} group gap-2 items-center`}>
            
            {/* show the reply button to left its this users message */}
            {isSentByUser && <button onClick={handleMessageReply} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800 hidden group-hover:flex">
                <FaReply />
            </button>}

            {/* downlaod,view buttons and reply */}
            {message.file && isSentByUser && <div className="hidden group-hover:flex gap-2 h-fit">
                <button onClick={handleDownload} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                    <FaDownload />
                </button>
                <button onClick={handleView} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                    <FaEye />
                </button>
            </div>}

            {/* delete button */}
            {isSentByUser && <button onClick={handleDelete} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800 group-hover:block hidden">
                <AiOutlineDelete />
            </button>}

            

            <div className="rounded relative  max-w-[80%] ">
                {!isSentByUser && prevMessageSenderID != message.senderID && activeChatInfo.type === 'group' && (
                    <div className="flex-shrink-0 m-2 ml-0">
                        <img
                            src={contacts[message.senderID]?.profile}
                            alt="ICON"
                            className="w-8 h-8 rounded-full"
                        />
                    </div>
                )}
                
                <div onClick={togglePopup} className={`w-full  ${isSentByUser ? 'bg-blue-500 text-white  ' : 'bg-gray-200 text-black'} rounded-md flex flex-col  px-2 py-2 cursor-pointer`}>
                    <div > {renderRepliedToMessage()} </div>
                    <div className="gap-2 flex w-full items-center">
                        <div className="flex w-full items-end flex-col">
                            {/* image or icon of file */}
                            {isImageFile && (
                                <img
                                    src={message.file.content}
                                    alt="Message media"
                                    className="max-w-[250px] rounded-md border border-gray-300 mb-2"
                                />
                            )}
                            {!isImageFile && message.file && (
                                <div className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md mb-2">
                                    {getFileIcon()}
                                </div>
                            )}
                            {/* text and time */}
                            {message.text && (
                                <p className={`inline-block w-full mb-1 ${isSentByUser ? 'text-end' : 'text-start'} break-words`}>{message.text}</p>
                            )}
                            <div className='flex gap-2 ml-2 text-[0.60rem]'>
                                {isSentByUser && (<span > {getStatusIcon(message.status)} </span>)}
                                <p>{formatTime(message.sentAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {showReadByPopup && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50  flex items-center justify-center z-50 py-4"
                        onClick={() => setShowReadByPopup(false)}
                    >
                        <div
                            className="bg-white border rounded-lg shadow-lg p-5 w-11/12 max-h-full overflow-y-scroll max-w-96 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowReadByPopup(false)}
                                className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-2xl font-bold"
                            >
                                &times;
                            </button>

                            {isImageFile && (
                                <div className='flex flex-col items-start justify-between gap-1'> 
                                    <img
                                        src={message.file.content}
                                        alt="Message media"
                                        className="max-w-[250px] rounded-md border border-gray-300 mb-2 m-auto mt-8"
                                    />
                                    <p className='text-sm'>Name: {message.file.name}</p>
                                    <p className='text-sm'>Size: {formatBytes(message.file.size)}</p>
                                </div>
                            )}

                            {isPdfFile && <div className='flex flex-col items-start justify-between gap-1'>
                                <FaFilePdf className='w-10 h-10 text-pink-600' />
                                <p className='text-sm'>Name: {message.file.name}</p>
                                <p className='text-sm'>Size: {formatBytes(message.file.size)}</p>
                            </div> }

                            {isAudioFile && (
                                <div className='flex flex-col items-start justify-between gap-1'>
                                    <FaFileAudio className='w-10 h-10 text-blue-500' />
                                    <p className='text-sm'>Name: {message.file.name}</p>
                                    <p className='text-sm'>Size: {formatBytes(message.file.size)}</p>
                                </div>
                            )}

                            {isVideoFile && (
                                <div className='flex flex-col items-start justify-between gap-1'>
                                    <FaVideo className='w-10 h-10 text-green-500' />
                                    <p className='text-sm'>Name: {message.file.name}</p>
                                    <p className='text-sm'>Size: {formatBytes(message.file.size)}</p>
                                </div>
                            )}

                            {isOtherFile && (
                                <div className='flex flex-col items-start justify-between gap-1'>
                                    <AiOutlineFile className='w-10 h-10 text-yellow-500' />
                                    <p className='text-sm'>Name: {message.file.name}</p>
                                    <p className='text-sm'>Size: {formatBytes(message.file.size)}</p>
                                </div>
                            )}

                            {message.text && <div className="mb-4 text-left">
                                <p className="text-sm font-semibold text-gray-800 mb-2">Message:</p>
                                <p className="bg-gray-100 text-gray-700 p-2 rounded-md break-words">{message.text}</p>
                            </div>}

                            <div className='flex gap-2 items-center justify-end text-xs'>
                                {isSentByUser && (<span > {getStatusIcon(message.status)} </span>)}
                                <p>{isSentByUser ? 'Sent at' : 'Recieved at: '} {formatTime(message.sentAt)}</p>
                            </div>


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


            {/* show the reply button to right its not this users message */}
            {!isSentByUser && <button onClick={handleMessageReply} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800 hidden group-hover:flex">
                <FaReply />
            </button>}

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
