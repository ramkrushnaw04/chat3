import React, { useEffect, useRef, useState } from 'react'
import { socketService } from '../socket/SocketService'
import { useSelector } from 'react-redux'
import ChatsItem from './ChatItem'


const Chats = () => {

    const socket = useRef()
    const userInfo = useSelector((state) => state.user.userInfo)
    const [chats, setChats] = useState([])


    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()

    }, [])


    useEffect(() => {
        if (!userInfo) return

        socket.current.emit('get-all-groupChats', { userID: userInfo._id }, (response) => {
            setChats(response)
        })
    }, [userInfo])

    useEffect(() => {
      console.log(chats)
    
      return () => {
        
      }
    }, [chats])
    


    return (
        <div className="flex flex-col w-screen flex-1 p-5">
            {chats.map((chat) => (
                <ChatsItem
                    key={chat._id}
                    data={chat}
                    isOnline={chat.isOnline}
                    onClick={() => onChatClick(chat.id)}
                />
            ))}
        </div>
    );
}

export default Chats
