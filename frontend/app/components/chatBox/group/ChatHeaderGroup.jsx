"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useSelector } from 'react-redux';
import MembersPopup from './MembersPopup';
import { socketService } from '../../socket/SocketService';

const ChatHeaderGroup = ({ data, activeChatHandler }) => {
    const mobileWidth = 768;
    const [mobile, setMobile] = useState(window.innerWidth < mobileWidth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [onlineMembersInCurrentChat, setOnlineMembersInCurrentChat] = useState([]);
    const [offlineMembersInCurrentChat, setOfflineMembersInCurrentChat] = useState([]);
    const onlineUsers = useSelector((state) => state.onlineUsers.onlineUsers);
    const socket = useRef(null);
    const userInfo = useSelector((state) => state.user.userInfo);
    const [typingUsers, setTypingUsers] = useState([]);

    useEffect(() => {
        function handleResize() {
            setMobile(window.innerWidth < mobileWidth);
        }
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!data || !data.members) return;

        const onlineUsersSet = new Set(onlineUsers);
        const onlineMembers = data.members.filter(item => onlineUsersSet.has(item));
        const offlineMembers = data.members.filter(item => !onlineUsersSet.has(item));

        setOnlineMembersInCurrentChat(onlineMembers);
        setOfflineMembersInCurrentChat(offlineMembers);
    }, [data, onlineUsers]);

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();

        socket.current.on('user-typing', response => {
            if (response.action === 'started-typing' && response.groupID == data.chatID) {
                setTypingUsers(prev => [...prev, `${response.firstName} ${response.lastName}`]);
            } else {
                setTypingUsers(prev => prev.filter(item => item !== `${response.firstName} ${response.lastName}`));
            }
        });

        return () => {
            socket.current.off('user-typing');
        };
    }, [userInfo]);

    const toggleModal = () => {
        setIsModalOpen((prev) => !prev);
    };

    const typingMessage = typingUsers.length > 0
        ? `${typingUsers.join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`
        : '';

    return (
        <>
            <div
                onClick={toggleModal}
                className="header flex items-center p-4 bg-white border-b cursor-pointer dark:bg-gray-900 dark:border-gray-800"
            >
                {mobile && (
                    <button className="mr-4" onClick={() => activeChatHandler(null)}>
                        <AiOutlineArrowLeft className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100" />
                    </button>
                )}
                <div className="relative mr-4">
                    <img src={data.profile || "images/group-profile.svg"} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-4 h-4 flex items-center justify-center border-2 border-white text-white text-xs font-bold rounded-full bg-green-500">
                        {onlineMembersInCurrentChat.length}
                    </span>
                </div>
                <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                        {data.name}
                    </h2>
                    {typingMessage && (
                        <p className="text-green-500 text-sm">{typingMessage}</p>
                    )}
                </div>
            </div>


            {isModalOpen &&
                <MembersPopup
                    onClose={toggleModal}
                    onlineMembers={onlineMembersInCurrentChat}
                    offlineMembers={offlineMembersInCurrentChat}
                    mobile={mobile}
                    userInfo={userInfo}
                    groupInfo={data}
                />
            }
        </>
    );
};

export default ChatHeaderGroup;
