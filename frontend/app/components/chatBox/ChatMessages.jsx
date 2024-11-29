import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Message from '../Message';
import AlertMessage from '../AlertMessage';
import { AiOutlineCloseCircle } from 'react-icons/ai';

const ChatMessages = ({ messages }) => {
    const userInfo = useSelector((state) => state.user.userInfo);
    const activeChatInfo = useSelector((state) => state.activeChat);
    const noOfMembers = activeChatInfo.members.length;
    const noOfMessages = messages.length
    const lastMessage = useRef(null)

    function formatTime(epochTime) {
        const date = new Date(epochTime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    useEffect(() => {
        if (!document.getElementById('lastMessage')) return
        document.getElementById('lastMessage').scrollIntoView({ behavior: "smooth", block: "center" })
    }, [messages])


    return messages && messages.length > 0 ? (
        <div className="messages flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => {
                // Update message status to "read" if it meets the condition
                if (msg.readBy.length >= noOfMembers - 1) msg = { ...msg, status: 'read' };
                const id = index == messages.length - 1 ? 'lastMessage' : ''

                if (msg.type === 'alert') {
                    return <AlertMessage id={id} key={index} text={msg.text} />;

                }

                return !msg.deleated ? (
                    <Message
                        id={id}
                        key={index}
                        message={msg}
                        isSentByUser={msg.senderID === userInfo._id}
                        prevMessageSenderID={index > 0 ? messages[index - 1].senderID : null}
                        ref={noOfMessages == index ? lastMessage : null}
                    />
                ) : (
                    <div
                        key={index}
                        className={`flex w-full mb-2 ${msg.senderID === userInfo._id ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`max-w-[90%] ${msg.senderID === userInfo._id
                                ? 'bg-blue-500 text-white dark:bg-blue-950 dark:text-white'
                                : 'bg-gray-200 text-black dark:bg-gray-800 dark:text-white'
                                } p-2 rounded-md flex flex-col gap-2`}
                        >
                            <div className="flex gap-2 items-center">
                                <AiOutlineCloseCircle />
                                <p>This message was deleted</p>
                            </div>

                            {/* message delivery status and sending time */}
                            <div className="flex gap-2 ml-2 text-[0.60rem] self-end">
                                <p>{formatTime(msg.sentAt)}</p>
                            </div>
                        </div>
                    </div>

                );
            })}
        </div>
    ) : (
        <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-200">
            <svg
                className="w-20 h-20 mb-4 text-gray-400 dark:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m-6-8h6m6 4v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6M5 12V6a2 2 0 012-2h10a2 2 0 012 2v6"
                />
            </svg>
            <p className="text-lg font-semibold">No Messages Yet</p>
            <p className="text-sm text-gray-500 mt-2">Send a message to start a conversation.</p>
        </div>
    );

};

export default ChatMessages;
