// components/ChatBox.js
import React, { useEffect, useRef, useState } from 'react';
import ChatHeaderPrivate from './private/ChatHeaderPrivate';
import ChatHeaderGroup from './group/ChatHeaderGroup';

import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import NoChatScreen from './NoChatScreen';
import { addNewMessage, setMessages, addNewPendingMessage, resetPendingMessages } from '@/app/store/slices/messagesSlice';
import { useSelector, useDispatch } from 'react-redux';
import { socketService } from '../socket/SocketService';
import { addOnlineUser, removeOnlineUser } from '@/app/store/slices/onlineUsersSlice';

const ChatBox = ({ activeChat, activeChatHandler }) => {
    const [chatMessages, setChatMessages] = useState([])
    const userInfo = useSelector((state) => state.user.userInfo)
    const storedMessages = useSelector((state) => state.messages)
    const socket = useRef(null)
    const dispatch = useDispatch()

    function receiveMessage(data) {
        console.log('received new message: ', data)
        dispatch(addNewMessage({ chatID: data.chatID, message: data }))
    }

    function handleNewOnlineUser(data) {
        // console.log('new user is online', data)
        dispatch(addOnlineUser(data))
    }

    function handleNewOfflineUser(data) {
        // console.log('user went offline: ', data)
        dispatch(removeOnlineUser(data))
    }

    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()

        socket.current.on('message', receiveMessage)
        socket.current.on('user-online', handleNewOnlineUser)
        socket.current.on('user-offline', handleNewOfflineUser)

        return () => {
            socket.current.off('message', receiveMessage)
            socket.current.off('user-online', handleNewOnlineUser)
            socket.current.off('user-offline', handleNewOfflineUser)
        }
    }, [])
    


    useEffect(() => {
        if (!userInfo) return

        socket.current.emit('get-online-users', { userID: userInfo._id }, (data) => {
            // data format: [ userIDs of online users ]
            for (const userID of data) {
                dispatch(addOnlineUser({userID}))
            }
        })
    }, [userInfo])


    // set messages of this chat when it is loaded 
    useEffect(() => {
        // if (!activeChat) return
        // // fetch from db
        // dispatch(setMessages({ chatID: activeChat._id, messages: [] }))
        // console.log(activeChat)
    }, [activeChat])

    // to update messages of active chat
    useEffect(() => {
        if (!activeChat || !storedMessages) return

        // for private chat
        if(activeChat.type == 'private')    
            setChatMessages(storedMessages[activeChat.chatID])
        // for group chat
        else if(activeChat.type == 'group')    
            setChatMessages(storedMessages[activeChat._id])

    }, [activeChat, storedMessages])

    return (
        <div className="chat-box w-full flex flex-col h-full">{
            activeChat ? (<>
                { activeChat.type == 'private' ? 
                    <ChatHeaderPrivate data={activeChat} activeChatHandler={activeChatHandler} /> :
                    <ChatHeaderGroup data={activeChat} activeChatHandler={activeChatHandler} />     
                }
                <ChatMessages messages={chatMessages} />
                <ChatInput activeChatID={activeChat.type == 'private' ? activeChat.chatID : activeChat._id} />
            </>) : <NoChatScreen />
        }</div>
    );
};

export default ChatBox;
