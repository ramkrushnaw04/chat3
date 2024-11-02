// components/ChatInput.js
import React, { useState, useRef, useEffect } from 'react';
import { FiPaperclip, FiSend } from 'react-icons/fi'; // Importing icons from react-icons
import { addNewMessage } from '@/app/store/slices/messagesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../socket/SocketService';


const ChatInput = ({ activeChatID }) => {
    const [message, setMessage] = useState("");
    const socket = useRef(null)
    const dispatch = useDispatch()
    const userInfo = useSelector((state) => state.user.userInfo)

    const typingTimeout = useRef(null)
    const isUserTyping = useRef(false)


    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()

    }, [])


    function handleSendMessage() {
        if (!message || !message.trim() || !socket.current || !activeChatID) return
        const messageData = {
            text: message,
            chatID: activeChatID,
            sentAt: Date.now(),
            senderID: userInfo._id
        }
        hideTypingIndicator()
        socket.current.emit('message', { room: activeChatID, message: messageData })
        dispatch(addNewMessage({ chatID: activeChatID, message: messageData }))
        setMessage('')
    };

    function showTypingIndicator() {
        clearTimeout(typingTimeout.current)    
        
        typingTimeout.current = setTimeout(() => {
            hideTypingIndicator()
        }, 1000);

        if(!isUserTyping.current) {
            socket.current.emit('user-typing', {userID: userInfo._id, groupID: activeChatID, action: 'started-typing'})
            isUserTyping.current = true
            // console.log('started typing...')
        }
        
    }


    function hideTypingIndicator() {
        clearTimeout(typingTimeout.current)
        socket.current.emit('user-typing', {userID: userInfo._id, groupID: activeChatID, action: 'stopped-typing'})
        isUserTyping.current = false
        // console.log('stopped typing...')
    }

    
    return (
        <div className="input-area flex items-center p-3 border-t">
            <button className="media-btn mr-2 p-2 border bg-blue-500 rounded-md text-gray-700 hover:bg-gray-300">
                <FiPaperclip size={18} color='white' />
            </button>
            <input
                type="text"
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value)
                    showTypingIndicator()
                }}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-md focus:outline-none"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Return') handleSendMessage()
                }}
            />
            <button onClick={handleSendMessage} className="send-btn ml-2 bg-blue-500 text-white p-2 rounded-md">
                <FiSend size={18} />
            </button>
        </div>
    );
};

export default ChatInput;
