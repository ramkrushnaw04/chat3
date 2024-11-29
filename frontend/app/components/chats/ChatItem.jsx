import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AiOutlineTeam } from 'react-icons/ai';
import { FaCheck, FaCheckDouble, FaRegClock, FaFilePdf, FaVideo, FaFileImage, FaFileAudio, FaFile } from 'react-icons/fa';

const ChatsItem = ({ data, isOnline, onClick }) => {
    const storedMessages = useSelector((state) => state.messages);
    const [pendingMessages, setPendingMessages] = useState(0);
    const [lastMessage, setLastMessage] = useState(null);
    const userInfo = useSelector((state) => state.user.userInfo);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <FaCheck className="text-gray-400 dark:text-gray-600" />;
            case 'delivered':
                return <FaCheckDouble className="text-gray-400 dark:text-gray-600" />;
            case 'read':
                return <FaCheckDouble className="text-green-500 dark:text-green-400" />;
            default:
                return <FaRegClock className="text-gray-400 dark:text-gray-600" />;
        }
    };

    const formatDate = (time) => {
        const date = new Date(time);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear() % 100;
        return `${day}/${month}/${year}`;
    };

    const getFileIcon = (file) => {
        const { type } = file;
        if (type.startsWith('image')) return <FaFileImage className="text-gray-500 dark:text-gray-300" />;
        if (type === 'application/pdf') return <FaFilePdf className="text-white dark:text-gray-300" />;
        if (type.startsWith('audio')) return <FaFileAudio className="text-white dark:text-gray-300" />;
        if (type.startsWith('video')) return <FaVideo className="text-white dark:text-gray-300" />;
        if (type == '') return <FaFile className="text-white dark:text-gray-300" />;
    };

    useEffect(() => {
        if (!storedMessages || !data) return;
        let message = storedMessages[data.chatID]?.at(-1);
        const pendingMessage = storedMessages.pendingMessages[data.chatID]?.at(-1);

        if (pendingMessage) {
            message = structuredClone(pendingMessage);
            message.isPending = true;
        }

        setLastMessage(message);
    }, [storedMessages, data]);

    useEffect(() => {
        setPendingMessages(storedMessages.pendingMessages[data.chatID]?.length || 0);
    }, [storedMessages, data]);

    return (
        <div
            onClick={onClick}
            className="flex items-center h-20 px-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-800 rounded-lg transition justify-between flex-shrink-0"
        >
            <div className="flex items-center w-full">
                <div className="relative">
                    <img
                        src={data.profile || (data.type === 'private' ? "images/user-profile.jpg" : "images/group-profile.svg")}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                </div>

                <div className="ml-4 flex-1">
                    <div className="flex justify-between w-full">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{data.name}</div>
                        {lastMessage && <span className="text-gray-500 text-xs pt-1 dark:text-gray-400">{formatDate(lastMessage.sentAt)}</span>}
                    </div>
                    {lastMessage && (
                        <div className="text-gray-500 text-sm flex items-center justify-between dark:text-gray-400">
                            {!lastMessage.file && <span className={`${lastMessage.isPending ? 'text-green-400' : 'text-gray-600 dark:text-gray-300'} truncate`} >{lastMessage.text}</span>}
                            {lastMessage.file && (
                                <div className="flex gap-1 items-center w-full">
                                    <span>{getFileIcon(lastMessage.file)}</span>
                                    <span className="truncate text-gray-600 dark:text-gray-300">{lastMessage.file.name}</span>
                                </div>
                            )}

                            {pendingMessages > 0 && (
                                <span className="w-4 h-4 text-center bg-green-500 text-white rounded-full text-xs font-bold">
                                    {pendingMessages}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatsItem;
