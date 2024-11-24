import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useSelector } from 'react-redux';
import { socketService } from '../../socket/SocketService';
import { toast } from 'react-toastify';

const getLastOnlineText = (lastSeenTime) => {
    const now = new Date();
    const diffInMs = now - new Date(lastSeenTime);
    const diffInMinutes = Math.floor(diffInMs / 60000);

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
};

const ChatHeaderPrivate = ({ data, activeChatHandler }) => {
    const mobileWidth = 768;
    const [mobile, setMobile] = useState(window.innerWidth < mobileWidth);
    const [isOnline, setIsOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const onlineUsers = useSelector((state) => state.onlineUsers.onlineUsers);
    const userInfo = useSelector((state) => state.user.userInfo);
    const contacts = useSelector((state) => state.contacts);
    const socket = useRef(null);
    const popupRef = useRef(null); // Ref for the popup
    const [otherUserInfo, setOtherUserInfo] = useState(null);
    const lastOnline = useSelector((state) => state.contacts.lastOnline);
    const [lastSeenText, setLastSeenText] = useState(getLastOnlineText(lastOnline[data._id]));

    useEffect(() => {
        function handleResize() {
            setMobile(window.innerWidth < mobileWidth);
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();

        socket.current.on('user-typing', (response) => {
            if (response.userID === data._id && response.groupID === data.chatID) {
                setIsTyping(response.action === 'started-typing');
            }
        });
    }, [userInfo]);

    useEffect(() => {
        if (!contacts) return;
        setOtherUserInfo(contacts[data._id]);
    }, [contacts, data]);

    useEffect(() => {
        if (!onlineUsers || !data._id) return;
        setIsOnline(onlineUsers.includes(data._id));
    }, [data, onlineUsers]);

    useEffect(() => {
        const updateLastSeenText = () => {
            setLastSeenText(getLastOnlineText(lastOnline[data._id]));
        };

        updateLastSeenText();
        const interval = setInterval(updateLastSeenText, 60000);

        return () => clearInterval(interval);
    }, [data, lastOnline]);

    const handleDeleteChat = () => {
        socket.current.emit('delete-chat', {
            chatID: data.chatID,
            userID: userInfo._id,
            otherUserID: data._id,
        }, (response) => {
            if (response.success) {
                toast(response.message)
            } else {
                toast.error(response.message)
            }
        });
        setShowPopup(false);
    };

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
            }
        };

        if (showPopup) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPopup]);

    return (
        <>
            <div
                className="header flex items-center p-4 bg-white border-b cursor-pointer dark:bg-gray-900 dark:border-gray-800"
                onClick={() => setShowPopup(true)}
            >
                {mobile && (
                    <button className="mr-4" onClick={() => activeChatHandler(null)}>
                        <AiOutlineArrowLeft className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100" />
                    </button>
                )}
                <div className="relative mr-4">
                    <img src={otherUserInfo?.profile || "images/user-profile.jpg"} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                    <span
                        className={`absolute border-2 border-white right-[-2px] bottom-[-2px] w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                    />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">{`${otherUserInfo?.firstName} ${otherUserInfo?.lastName}`}</h2>
                    {isTyping && <p className="text-sm text-green-400">Typing...</p>}
                    {!isOnline && <p className="text-sm text-gray-400 dark:text-gray-500">Last seen {lastSeenText}</p>}
                </div>
            </div>

            {showPopup && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50 px-4">
                    <div ref={popupRef} className="bg-white p-6 rounded-lg w-11/12 max-w-96 shadow-lg relative dark:bg-gray-900 dark:text-gray-100">
                        <button
                            onClick={() => setShowPopup(false)}
                            className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 text-3xl"
                        >
                            &times;
                        </button>
                        <div className="flex flex-col items-center">
                            <img
                                src={otherUserInfo?.profile || "images/user-profile.jpg"}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover mb-4"
                            />
                            <h2 className="text-lg font-semibold">{`${otherUserInfo?.firstName} ${otherUserInfo?.lastName}`}</h2>
                            <p className="text-gray-500 text-sm dark:text-gray-400">{otherUserInfo?.email}</p>
                        </div>
                        <button
                            onClick={handleDeleteChat}
                            className="mt-4 w-full py-2 text-red-500 border border-red-500 hover:bg-red-100  dark:hover:bg-red-950 dark:hover:text-white  font-semibold rounded-lg shadow-md transition"
                        >
                            Delete Chat
                        </button>
                    </div>
                </div>
            )}
        </>

    );
};

export default ChatHeaderPrivate;
