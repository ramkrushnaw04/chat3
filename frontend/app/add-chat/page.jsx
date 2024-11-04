

"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import { useEffect, useRef, useState } from "react";
import { socketService } from "../components/socket/SocketService";
import SearchedUser from "../components/addChat/SearchedUser";
import { setUserInfo } from "@/app/store/slices/userSlice";
import { useSelector } from "react-redux";
import Profile from "../profile/page";

export default function Chats() {
    const router = useRouter();
    let [currentUser] = useAuthState(auth);
    const storedUserData = localStorage.getItem('chat3UserInfo');
    const socket = useRef(null);
    const [userList, setUserList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const userInfo = useSelector((state) => state.user.userInfo)

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);


    useEffect(() => {
        socket.current.emit('get-users-from-query', {query: searchQuery}, (response) => {
            setUserList(response)
        })

    }, [searchQuery])


    if (!currentUser && !storedUserData) {
        router.push('/log-in');
    } else {
        currentUser = storedUserData;
    }


    const handleUserSelect = (user) => {
        const myUserID = userInfo._id
        const otherID = user._id

        socket.current.emit('create-chat', { name: 'chatName', profile: 'chatProfile', userIDs: [myUserID, otherID] }, (response) => {
            if(response.success) {
                router.push('/')
            }
        })
    };

    return (
        <div className="relative w-screen h-screen flex flex-col items-center bg-white text-black">
            <Navbar />

            <div className="w-11/12 max-w-md mt-10">
                <input
                    type="text"
                    placeholder="Search for people..."
                    className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <SearchedUser users={userList} searchQuery={searchQuery} onSelectUser={handleUserSelect} />
        </div>
    );
}
