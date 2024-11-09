// components/ChatBox.js
import React, { useEffect, useRef, useState } from 'react';
import ChatHeaderPrivate from './private/ChatHeaderPrivate';
import ChatHeaderGroup from './group/ChatHeaderGroup';

import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import NoChatScreen from './NoChatScreen';
import { addNewMessage, addNewPendingMessage, addMultipleNewMessage, resetPendingMessages, setMessages, setMessagesInBatch } from '@/app/store/slices/messagesSlice';
import { useSelector, useDispatch } from 'react-redux';
import { socketService } from '../socket/SocketService';
import { addOnlineUser, removeOnlineUser } from '@/app/store/slices/onlineUsersSlice';
import { addLastOnlineStatus, removeLastOnlineStatus } from '@/app/store/slices/contactsSlice';


const ChatBox = ({ activeChat, activeChatHandler }) => {
    const [chatMessages, setChatMessages] = useState([])
    const userInfo = useSelector((state) => state.user.userInfo)
    const storedMessages = useSelector((state) => state.messages)
    const socket = useRef(null)
    const dispatch = useDispatch()

    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()


        function receiveMessage(data) {
            const chatID = activeChat ? activeChat.chatID : null
            // if message is sent to current chat, add current user to readBy of the message
            if (chatID == data.chatID) {
                // sent message to backend that this message is read
                const messagesReadIDs = [{messageID: data.ID, senderID: data.senderID}]
                socket.current.emit('messages-read', { chatID: activeChat.chatID, pendingMessagesIDs: messagesReadIDs, userID: userInfo._id })

                dispatch(addNewMessage({ 
                    chatID: data.chatID, 
                    message: data
                }))
            } 
            // if the message in not sent in current chat, add it to pending messages
            else {
                dispatch(addNewPendingMessage({ chatID: data.chatID, message: data }))
            }

        }

        function handleNewOnlineUser(data) {
            // console.log('new user is online', data)
            dispatch(addOnlineUser({userID: data.userID}))
            dispatch(addLastOnlineStatus(data))
        }

        function handleNewOfflineUser(data) {
            // console.log('user went offline: ', data)
            dispatch(removeOnlineUser({userID: data.userID}))
            // dispatch(removeLastOnlineStatus({userID: data.userID}))
            dispatch(addLastOnlineStatus({userID: data.userID, lastOnline: data.lastOnline}))
        }

        socket.current.on('message', receiveMessage)
        socket.current.on('user-online', handleNewOnlineUser)
        socket.current.on('user-offline', handleNewOfflineUser)

        return () => {
            socket.current.off('message', receiveMessage)
            socket.current.off('user-online', handleNewOnlineUser)
            socket.current.off('user-offline', handleNewOfflineUser)
        }
    }, [activeChat])


    // manage message updates
    useEffect(() => {
        if (!storedMessages) return

        function handleMessageUpdate(data) {
            // when message is received by server
            if (data.type == 'sent') { // data: {messageID, chatID, status, type}
                const oldMessages = storedMessages[data.chatID] || []
                const newMessages = oldMessages.map(item => {
                    if (item.ID == data.messageID) {
                        return { ...item, status: data.status }
                    } else return item
                })
                dispatch(setMessages({ chatID: data.chatID, messages: newMessages }))
            }
            // when message is seen by a client
            else if (data.type == 'read') { // data: {chatID, messageID, type, senderID}
                const oldMessages = storedMessages[data.chatID] || []
                const newMessages = oldMessages.map(item => {
                    if(item.ID == data.messageID) {
                        return {
                            ...item, 
                            readBy: [...item.readBy, data.userID]
                        }
                    }
                    else return item
                })
                dispatch(setMessages({ chatID: data.chatID, messages: newMessages }))
            }
        }

        socket.current.on('update-message', handleMessageUpdate)

        return () => {
            socket.current.off('update-message', handleMessageUpdate)
        }
    }, [storedMessages])


    useEffect(() => {
        if (!userInfo) return

        socket.current.emit('get-online-users', { userID: userInfo._id }, (data) => {
            // data format: [ userIDs of online users ]
            for (const userID of data) {
                dispatch(addOnlineUser({ userID }))
            }
        })
    }, [userInfo])

    // handle pending messages here
    useEffect(() => {
        if (!activeChat || !storedMessages || !userInfo) return
        const pendingMessages = storedMessages.pendingMessages[activeChat.chatID] || [] // if there are no pending messages and storedMessages is not updated yet
        if (!pendingMessages.length) return

        const pendingMessagesIDs = pendingMessages.map(item => {
            return {
                messageID: item.ID,
                senderID: item.senderID
            }
        })

        // console.log('pending ids: ', pendingMessagesIDs)

        if(pendingMessages.length)
            socket.current.emit('messages-read', { chatID: activeChat.chatID, pendingMessagesIDs, userID: userInfo._id })

        dispatch(addMultipleNewMessage({ chatID: activeChat.chatID, messages: pendingMessages }))
        dispatch(resetPendingMessages({ chatID: activeChat.chatID }))
    }, [activeChat, userInfo])




    // to update messages of active chat
    useEffect(() => {
        if (!activeChat || !storedMessages) return
        setChatMessages(storedMessages[activeChat.chatID])

    }, [activeChat, storedMessages])

    return (
        <div className="chat-box w-full flex flex-col h-full">{
            activeChat ? (<>
                {activeChat.type == 'private' ?
                    <ChatHeaderPrivate data={activeChat} activeChatHandler={activeChatHandler} /> :
                    <ChatHeaderGroup data={activeChat} activeChatHandler={activeChatHandler} />
                }
                <ChatMessages messages={chatMessages}  />
                <ChatInput activeChatID={activeChat.chatID} />
            </>) : <NoChatScreen />
        }</div>
    );
};

export default ChatBox;
