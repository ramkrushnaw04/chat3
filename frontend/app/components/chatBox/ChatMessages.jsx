// components/ChatMessages.js
import React from 'react';
import { useSelector } from 'react-redux';
import Message from '../Message';

const ChatMessages = ({ messages }) => {
    const userInfo = useSelector((state) => state.user.userInfo);
    const activeChatInfo = useSelector((state) => state.activeChat)
    const noOfMembers = activeChatInfo.members.length

    return messages && messages.length > 0 ? (
        <div className="messages flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => {
                if (msg.readBy.length >= noOfMembers-1)
                    msg = {...msg, status: 'read'}

                return (
                    <Message
                        key={index}
                        message={msg}
                        isSentByUser={msg.senderID === userInfo._id}
                    />)
            }
            )}
        </div>
    ) : (
        <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-600">
            <svg
                className="w-20 h-20 mb-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m-6-8h6m6 4v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6M5 12V6a2 2 0 012-2h10a2 2 0 012 2v6" />
            </svg>
            <p className="text-lg font-semibold">No Messages Yet</p>
            <p className="text-sm text-gray-500 mt-2">Send a message to start a conversation.</p>
        </div>
    );
};

export default ChatMessages;
