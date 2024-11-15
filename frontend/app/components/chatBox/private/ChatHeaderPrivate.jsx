import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useSelector } from 'react-redux';
import { socketService } from '../../socket/SocketService';

// function to format the last online time
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
    const onlineUsers = useSelector((state) => state.onlineUsers.onlineUsers);
    const userInfo = useSelector((state) => state.user.userInfo);
    const contacts = useSelector((state) => state.contacts);
    const socket = useRef(null);
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

    // Receive typing status
    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();

        socket.current.on('user-typing', (response) => {
            if (response.userID === data._id && response.groupID === data.chatID) {
                setIsTyping(response.action === 'started-typing');
            }
        });
    }, [userInfo]);

    // Update other user in the chat
    useEffect(() => {
        if (!contacts) return;
        setOtherUserInfo(contacts[data._id]);
    }, [contacts, data]);

    // Show online presence in online users list
    useEffect(() => {
        if (!onlineUsers || !data._id) return;
        setIsOnline(onlineUsers.includes(data._id));
    }, [data, onlineUsers]);

    // Update last seen text every minute
    useEffect(() => {
        const updateLastSeenText = () => {
            setLastSeenText(getLastOnlineText(lastOnline[data._id]));
        };

        updateLastSeenText();
        const interval = setInterval(updateLastSeenText, 60000); // Update every 1 minute

        return () => clearInterval(interval); // Clear interval on component unmount
    }, [data, lastOnline]);


    return (
        <div className="header flex items-center p-4 bg-white border-b">
            {mobile && (
                <button className="mr-4" onClick={() => activeChatHandler(null)}>
                    <AiOutlineArrowLeft className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                </button>
            )}
            <div className="relative mr-4">
                <img src={otherUserInfo?.profile} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                <span
                    className={`absolute border-2 border-white right-[-2px] bottom-[-2px] w-3 h-3 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                />
            </div>
            <div>
                <h2 className="font-semibold">{`${otherUserInfo?.firstName} ${otherUserInfo?.lastName}`}</h2>
                {isTyping && (
                    <p className="text-sm text-green-400">Typing...</p>
                )}
                {!isOnline && (
                    <p className="text-sm text-gray-400">
                        Last seen {lastSeenText}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatHeaderPrivate;
