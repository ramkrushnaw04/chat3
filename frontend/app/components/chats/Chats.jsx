import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../socket/SocketService';
import { useSelector, useDispatch } from 'react-redux';
import ChatsItem from './ChatItem';
import { BsChatDotsFill } from "react-icons/bs";
import { AiOutlineUserAdd, AiOutlineTeam } from "react-icons/ai";
import { useRouter } from 'next/navigation';
import { addContactInfos, setLastOnlineStatuses } from '@/app/store/slices/contactsSlice';
import { setActiveChatInfo } from '@/app/store/slices/activeChatSlice';
import { setPendingMessages, setMessages, resetPendingMessages, addMultipleNewMessage } from '@/app/store/slices/messagesSlice';
import { addOnlineUser } from '@/app/store/slices/onlineUsersSlice';


const Chats = ({ style, activeChatHandler }) => {
    const socket = useRef();
    const userInfo = useSelector((state) => state.user.userInfo);
    const [chats, setChats] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const dispatch = useDispatch()
    const activeChat = useSelector(state => state.activeChat)
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
                type: 'group'
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
            socket.current.emit('get-all-messages-of-chat', { chatID: chat.chatID }, (response) => {
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


    return (
        <div className="flex flex-col w-full flex-1 relative" style={style}>
            <input
                type="text"
                placeholder="Search People..."
                className="px-3 w-auto m-4 bg-gray-200 text-black border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-14 "
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Button to add chat and create group chats */}
            <button
                onClick={toggleOptions}
                className="absolute bottom-4 right-4 w-14 h-14 bg-blue-500 hover:bg-blue-700 text-white flex items-center justify-center rounded-lg shadow-lg transition duration-200"
            >
                <BsChatDotsFill size={24} />
            </button>

            {/* Options: create private chat and create group */}
            {showOptions && (
                <div className="absolute bottom-20 p-2 bg-white text-black rounded-lg shadow-lg right-5 flex flex-col gap-3">
                    <button
                        onClick={() => router.push('/add-chat')}
                        className="flex items-center gap-2 px-5 py-2 hover:bg-gray-200 text-gray-700 transition duration-200 rounded-lg"
                    >
                        <AiOutlineUserAdd size={20} /> Add Chat
                    </button>
                    <button
                        onClick={() => router.push('/create-group')}
                        className="flex items-center gap-2 px-5 py-2 hover:bg-gray-200 text-gray-700 transition duration-200 rounded-lg"
                    >
                        <AiOutlineTeam size={20} /> Create Group
                    </button>
                </div>
            )}

            <div className="px-4 gap-3 flex flex-col overflow-y-scroll">
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
                    <p className="text-center text-gray-500 mt-4">No chats found.</p>
                )}
            </div>

        </div>
    );
};

export default Chats;
