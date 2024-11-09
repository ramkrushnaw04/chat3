import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../socket/SocketService';
import { useSelector, useDispatch } from 'react-redux';
import ChatsItem from './ChatItem';
import { BsChatDotsFill } from "react-icons/bs";
import { AiOutlineUserAdd, AiOutlineTeam } from "react-icons/ai";
import { useRouter } from 'next/navigation';
import { addContactInfos, setLastOnlineStatuses } from '@/app/store/slices/contactsSlice';
import { setActiveChatInfo } from '@/app/store/slices/activeChatSlice';

const Chats = ({ style, activeChatHandler }) => {
    const socket = useRef();
    const userInfo = useSelector((state) => state.user.userInfo);
    const lastOnline = useSelector((state) => state.contacts.lastOnline);
    const [chats, setChats] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const dispatch = useDispatch()

    const toggleOptions = () => setShowOptions(!showOptions);

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
                if (chat.type === 'private') {
                    let filtered = chat.members.filter(
                        (item) => item.userID?._id !== userInfo?._id
                    );
                    filtered = filtered[0]?.userID;

                    if (filtered) {
                        const otherUser = {
                            name: filtered.firstName+' '+filtered.lastName,
                            chatID: chat._id,
                            _id: filtered._id,
                            type: 'private',
                            profile: filtered.profile,
                            members: chat.members.map(item => item.userID._id)
                        } // for private chat this is more efficient than extracting data in each chat individually
                        return otherUser
                    }
                } else if (chat.type == 'group') {
                    const otherUser = {
                        chatID: chat._id,
                        members: chat.members.map(item => item.userID._id),
                        profile: chat.profile,
                        name: chat.name,
                        type: 'group'
                    }; // for group chat we only pass userID of members of the chat and access each users data in the chat itself
                    return otherUser
                }
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

    // Filter chats based on search query
    const filteredChats = chats.filter(chat => {
        return chat && chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    });

    return (
        <div className="flex flex-col w-full flex-1 relative" style={style}>
            <input
                type="text"
                placeholder="Search People..."
                className="px-3 w-auto m-4 bg-gray-200 text-black border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Button to add chat and create group chats */}
            <button
                onClick={toggleOptions}
                className="absolute bottom-4 right-4 w-10 h-10 bg-blue-500 hover:bg-blue-700 text-white flex items-center justify-center rounded-lg shadow-lg transition duration-200"
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
                {userInfo && filteredChats.map((chat) => 
                    <ChatsItem
                        key={chat.chatID}
                        data={chat}
                        isOnline={false}
                        onClick={() => onChatClick(chat)}
                    />
                )}
            </div>
        </div>
    );
};

export default Chats;
