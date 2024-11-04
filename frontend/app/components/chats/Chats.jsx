import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../socket/SocketService';
import { useSelector } from 'react-redux';
import ChatsItem from './ChatItem';
import { BsChatDotsFill } from "react-icons/bs";
import { AiOutlineUserAdd, AiOutlineTeam } from "react-icons/ai";
import { useRouter } from 'next/navigation';

const Chats = ({ style, activeChatHandler }) => {
    const socket = useRef();
    const userInfo = useSelector((state) => state.user.userInfo);
    const [chats, setChats] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const toggleOptions = () => setShowOptions(!showOptions);

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);

    useEffect(() => {
        if (!userInfo) return;
        socket.current.emit('get-all-groupChats', { userID: userInfo._id }, (response) => {
            setChats(response);
        });
    }, [userInfo]);

    const onChatClick = (data) => {
        activeChatHandler(data);
    };

    // Filter chats based on search query
    const filteredChats = chats.filter(chat => {
        let otherUser;

        if (chat.type === 'private') {
            const filtered = chat.members.filter(
                (item) => item.userID?._id !== userInfo?._id
            );
            otherUser = filtered[0]?.userID;
        } else {
            return chat.name.toLowerCase().includes(searchQuery.toLowerCase())
        }

        // If otherUser exists, check if their name matches the search query
        if (otherUser) {
            const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
        }

        return false;
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
                {userInfo && filteredChats.map((chat) => {
                    let otherUser;

                    if (chat.type === 'private') {
                        const filtered = chat.members.filter(
                            (item) => item.userID?._id !== userInfo?._id
                        );
                        otherUser = filtered[0]?.userID;

                        if (otherUser) {
                            otherUser.type = 'private';
                            otherUser.chatID = chat._id
                        }
                    } else {
                        otherUser = chat;
                    }

                    return otherUser ? (
                        <ChatsItem
                            key={chat._id}
                            data={otherUser}
                            isOnline={chat.isOnline}
                            onClick={() => onChatClick(otherUser)}
                        />
                    ) : null;
                })}
            </div>
        </div>
    );
};

export default Chats;
