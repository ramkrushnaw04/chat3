import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../socket/SocketService';
import { useSelector, useDispatch } from 'react-redux';
import ChatsItem from './ChatItem';
import { BsChatDotsFill } from "react-icons/bs";
import { AiOutlineUserAdd, AiOutlineTeam } from "react-icons/ai";
import { useRouter } from 'next/navigation';
import { addContactInfos, addLastOnlineStatuses, setLastOnlineStatuses } from '@/app/store/slices/contactsSlice';
import { setActiveChatInfo } from '@/app/store/slices/activeChatSlice';
import { setPendingMessages, setMessages, resetPendingMessages, addMultipleNewMessage, addNewPendingMessage, addNewMessage } from '@/app/store/slices/messagesSlice';
import { addOnlineUser, addOnlineUsers } from '@/app/store/slices/onlineUsersSlice';



const Chats = ({ style, activeChatHandler }) => {
    const socket = useRef();
    const userInfo = useSelector((state) => state.user.userInfo);
    const [chats, setChats] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const dispatch = useDispatch()
    const activeChat = useSelector(state => state.activeChat)
    const onlineusers = useSelector(state => state.onlineUsers)
    const storedMessages = useSelector(state => state.messages)
    const toggleOptions = () => setShowOptions(!showOptions);

    function filterChat(chat) {
        if (chat.type === 'private') {
            let filtered = chat.members.filter(
                (item) => item.userID?._id !== userInfo?._id
            );
            filtered = filtered[0]?.userID;

            if (filtered) {
                const otherUser = {
                    name: filtered.firstName + ' ' + filtered.lastName,
                    chatID: chat._id,
                    _id: filtered._id,
                    type: 'private',
                    profile: filtered.profile,
                    members: chat.members.map(item => item.userID._id)
                } // for private chat this is more efficient than extracting data in each chat individually
                return otherUser
            }
        } else if (chat.type === 'group') {
            const otherUser = {
                chatID: chat._id,
                members: chat.members.map(item => item.userID._id),
                profile: chat.profile,
                name: chat.name,
                type: 'group',
                description: chat.description
            }; // for group chat we only pass userID of members of the chat and access each users data in the chat itself
            return otherUser
        }
    }


    // initialize socket
    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);

    useEffect(() => {
        if (!userInfo) return;

        socket.current.emit('get-all-groupChats', { userID: userInfo._id }, (response) => {
            let users = new Map()
            let userIDs = new Set()
            for (const group of response) {
                for (const member of group.members) {
                    users.set(member.userID._id, member.userID)
                    userIDs.add(member.userID._id)
                }
            }
            // set contacts
            const usersObject = Object.fromEntries(users)
            dispatch(addContactInfos(usersObject))

            // filter chats data and provide only necessary data like name, profile and _id of chat
            const chats = response.map(chat => {
                return filterChat(chat)
            });
            setChats(chats);

            // set last online statuses of users
            userIDs = Array.from(userIDs)
            socket.current.emit('get-last-online-statuses', { userIDs }, (response) => {
                dispatch(setLastOnlineStatuses(response))
            })
        });
    }, [userInfo]);

    const onChatClick = (data) => {
        dispatch(setActiveChatInfo(data))
        activeChatHandler(data);
    };

    useEffect(() => {
        if (!userInfo) return

        function handleGroupCreation(data) {
            // add new chat
            const chat = filterChat(data)
            setChats(prev => [...prev, chat])

            let userIDs = new Set()
            let users = new Map()

            // add new users to contacts
            for (const member of data.members) {
                users.set(member.userID._id, member.userID)
            }
            const usersObject = Object.fromEntries(users)
            dispatch(addContactInfos(usersObject))


            // set online statuses
            for (const item of data.members) {
                userIDs.add(item.userID._id)
            }
            userIDs = Array.from(userIDs)
            socket.current.emit('get-last-online-statuses', { userIDs }, (response) => {
                dispatch(setLastOnlineStatuses(response))
            })

            // get online users
            socket.current.emit('get-online-users', { userID: userInfo._id }, (data) => {
                // data format: [ userIDs of online users ]
                for (const userID of data) {
                    dispatch(addOnlineUser({ userID }))
                }
            })

        }
        socket.current.on('group-created', handleGroupCreation)

        return () => {
            socket.current.off('group-created', handleGroupCreation)
        }
    }, [userInfo])


    // Filter chats based on search query
    const filteredChats = chats.filter(chat => {
        return chat && chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    });


    // fetch all the messages of each chat from db initially
    useEffect(() => {
        if (!activeChat || !storedMessages || storedMessages[activeChat.chatID]) return

        for (const chat of chats) {
            socket.current.emit('get-all-messages-of-chat', { chatID: chat.chatID, userID: userInfo._id }, (response) => {
                // read messages are read by this user (we consider messages sent by this user as read)
                const readMessages = response.filter(item => item.readBy.includes(userInfo._id) || item.senderID == userInfo._id)
                // pending messages are messages that are yet to be read by this user
                const pendingMessages = response.filter(item => !item.readBy.includes(userInfo._id) && item.senderID != userInfo._id)
                dispatch(setMessages({
                    chatID: chat.chatID,
                    messages: readMessages
                }))
                dispatch(setPendingMessages({
                    chatID: chat.chatID,
                    messages: pendingMessages
                }))
            })
        }
    }, [activeChat, userInfo, chats])



    useEffect(() => {
        if (!chats || !activeChat || !userInfo) return

        function handleGroupUpdate(data) {
            // data: {chatID, userID, time, type}
            // when other user left the chat
            if (data.type == 'userLeave' && data.userID != userInfo._id) {
                // filter out chats
                setChats(prev => {
                    return prev.map(chat => {
                        if (chat.chatID != data.chatID) return chat

                        const members = chat.members.filter(item => item != data.userID)

                        if (activeChat && activeChat.chatID == data.chatID) {
                            setActiveChatInfo({
                                ...activeChat,
                                members
                            })
                            activeChatHandler(({
                                ...activeChat,
                                members
                            }))
                        }


                        return {
                            chatID: data.chatID,
                            members,
                            description: chat.description,
                            name: chat.name,
                            profile: chat.profile,
                            type: chat.type
                        }
                    })
                })

                // add alert message
                // if pending messages are present then add in pending messages or in normal messages
                if (storedMessages.pendingMessages[data.chatID]?.length) {
                    dispatch(addNewPendingMessage({ chatID: data.chatID, message: data.alertMessage }))
                } else {
                    dispatch(addNewMessage({ chatID: data.chatID, message: data.alertMessage }))
                }
            }
            // when this user leaves the chat
            else if (data.type == 'userLeave' && data.userID == userInfo._id) {
                setChats(prev => {
                    return prev.filter(chat => chat.chatID != data.chatID)
                })
                setActiveChatInfo(null)
                activeChatHandler(null)
            }
            // update this users chat when other user joins
            else if (data.type == 'userJoin' && data.userID != userInfo._id) {
                // console.log(data.userID, userInfo._id)
                // console.log('user is joining the group: ', data)
                // add new user to contacts
                dispatch(addContactInfos({ [data.userID]: data.userInfo }))

                // add the userID to the members of the chat
                setChats(prev => {
                    return prev.map(chat => {
                        if (chat.chatID != data.chatID) return chat

                        const members = [...chat.members, data.userID]
                        if (activeChat && activeChat.chatID == data.chatID) {
                            setActiveChatInfo({
                                ...activeChat,
                                members
                            })
                            activeChatHandler(({
                                ...activeChat,
                                members
                            }))
                        }

                        return {
                            chatID: data.chatID,
                            members,
                            description: chat.description,
                            name: chat.name,
                            profile: chat.profile,
                            type: chat.type
                        }

                    })
                })

                // add alert message
                // if pending messages are present then add in pending messages or in normal messages
                if (storedMessages.pendingMessages[data.chatID]?.length) {
                    dispatch(addNewPendingMessage({ chatID: data.chatID, message: data.alertMessage }))
                } else {
                    dispatch(addNewMessage({ chatID: data.chatID, message: data.alertMessage }))
                }

            }
            // if this is the user which is getting added
            else if (data.type == 'userJoin' && data.userID == userInfo._id) {
                // add contact infos of members
                dispatch(addContactInfos(data.userInfos))

                // add group in the chats
                const userGroup = structuredClone(data.group)
                userGroup.members = userGroup.members.map(item => String(item.userID))
                userGroup.chatID = userGroup._id

                setChats(prev => {
                    return [...prev, userGroup]
                })

                // update lastOnline users
                dispatch(addLastOnlineStatuses(data.lastOnlineStatuses))

                // add online memebrs
                dispatch(addOnlineUsers(data.onlineMembers))
            }

        }
        socket.current.on('group-update', handleGroupUpdate)

        return () => {
            socket.current.off('group-update', handleGroupUpdate)
        }
    }, [chats, activeChat, userInfo])

    // handle update group
    useEffect(() => {
        if (!chats.length || !activeChat) return

        socket.current.on('edit-group', editedGroupInfo => {
            let updatedGroup
            const updatedChats = chats.map(chat => {
                if (chat.chatID == editedGroupInfo.chatID) {
                    const newChat = structuredClone(chat)
                    newChat.name = editedGroupInfo.name
                    newChat.description = editedGroupInfo.description,
                        newChat.profile = editedGroupInfo.profile

                    updatedGroup = newChat
                    return newChat
                } else return chat
            })
            setChats(updatedChats)

            // update active chat if this is active chat
            if (editedGroupInfo.chatID == activeChat.chatID) {
                setActiveChatInfo(updatedGroup)
                activeChatHandler(updatedGroup)
            }
        })

        socket.current.on('delete-chat', response => {
            setChats(prev => {
                return prev.filter(chat => chat.chatID != response.chatID)
            })

            if (activeChat.chatID == response.chatID) {
                setActiveChatInfo(null)
                activeChatHandler(null)
            }
        })

    }, [chats, activeChat])



    return (
        <div className="flex flex-col md:w-[350px] flex-1 relative overflow-y-scroll " style={style}>
            <input
                type="text"
                placeholder="Search People..."
                className="px-3 w-auto m-4 bg-gray-200 dark:bg-gray-800 dark:text-gray-100 text-black border-none rounded-lg focus:outline-none  h-10 text-sm "
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Button to add chat and create group chats */}
            <button
                onClick={toggleOptions}
                className="absolute bottom-4 right-4 w-12 h-12 dark:bg-blue-900 dark:hover:bg-blue-950 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center rounded-lg shadow-2xl transition duration-200"
            >
                <BsChatDotsFill size={24} />
            </button>


            {/* Options: create private chat and create group */}
            {showOptions && (
                <div className="absolute bottom-20 p-2 bg-white text-black rounded-lg shadow-lg right-5 flex flex-col gap-3 dark:bg-gray-800 dark:text-white">
                    <button
                        onClick={() => router.push('/add-chat')}
                        className="flex items-center gap-2 px-5 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition duration-200 rounded-lg"
                    >
                        <AiOutlineUserAdd size={20} /> Add Chat
                    </button>
                    <button
                        onClick={() => router.push('/create-group')}
                        className="flex items-center gap-2 px-5 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition duration-200 rounded-lg"
                    >
                        <AiOutlineTeam size={20} /> Create Group
                    </button>
                </div>
            )}

            <div className="px-4 gap-3 flex flex-col overflow-y-scroll flex-1 pb-20">
                {userInfo && filteredChats.length > 0 ? (
                    filteredChats.map((chat) => (
                        <ChatsItem
                            key={chat.chatID}
                            data={chat}
                            isOnline={false}
                            onClick={() => onChatClick(chat)}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-4 w-full h-full flex justify-center items-center">No chats found.</p>
                )}
            </div>


        </div>
    );
};

export default Chats;
