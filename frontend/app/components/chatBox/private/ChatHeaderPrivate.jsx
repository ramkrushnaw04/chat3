// components/ChatHeader.js
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useSelector } from 'react-redux';
import { socketService } from '../../socket/SocketService';


const ChatHeaderPrivate = ({ data, activeChatHandler }) => {

    const mobileWidth = 768
    const [mobile, setMobile] = useState(window.innerWidth < mobileWidth ? true : false)
    const [isOnline, setIsOnline] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const onlineUsers = useSelector((state) => state.onlineUsers.onlineUsers)
    const userInfo = useSelector((state) => state.user.userInfo)
    const socket = useRef(null)


    useEffect(() => {
        // for width calculation
        function handleResize() {
            setMobile(window.innerWidth < mobileWidth ? true : false)
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        };
    }, [])


    // recieve typing status
    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()

        socket.current.on('user-typing', response => {
            if(response.userID == data._id && response.groupID == data.chatID) {
                setIsTyping(response.action == 'started-typing')
            }
        })

    }, [userInfo])


    useEffect(() => {
        if (!onlineUsers) return
        setIsOnline(onlineUsers.includes(data._id))
    }, [data, onlineUsers])


    return (


        <div className="header flex items-center p-4 bg-white border-b">
            {mobile && <button className="mr-4" onClick={() => {
                activeChatHandler(null)
            }} >
                <AiOutlineArrowLeft className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </button>
            }
            <div className="relative mr-4">
                <img src={data.profile} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                <span
                    className={`absolute  border-2 border-white right-[-2px] bottom-[-2px] w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                />
            </div>
            <div>
                <h2 className="font-semibold">{data.type == 'private' ? `${data.firstName} ${data.lastName}` : data.name}</h2>
                {isTyping && (<p className="text-sm text-green-400">
                    Typing...
                </p>)}
                
                {!isOnline && (<p className="text-sm text-gray-400">
                    Last seen 14 minutes ago
                </p>)}
                
            </div>
        </div>

    );
}

export default ChatHeaderPrivate;
