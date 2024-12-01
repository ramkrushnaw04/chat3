

"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import { useEffect, useRef, useState } from "react";
import { socketService } from "../components/socket/SocketService";
import SearchedUser from "../components/addChat/SearchedUser";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function Chats() {
    const router = useRouter();
    let [currentUser] = useAuthState(auth);
    const socket = useRef(null);
    const [userList, setUserList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const userInfo = useSelector((state) => state.user.userInfo)
    const isRequestSent = useRef(false)

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);


    useEffect(() => {
        socket.current.emit('get-users-from-query', { query: searchQuery }, (response) => {
            setUserList(response)
        })
    }, [searchQuery])


    useEffect(() => {
        const storedUser = localStorage.getItem('chat3UserInfo');
        if (!currentUser && !storedUser) {
            router.push('/log-in');
        }
    }, [currentUser]);



    const handleUserSelect = (user) => {
        if (isRequestSent.current) {
            return
        }

        const myUserID = userInfo._id
        const otherID = user._id

        // make request only if data is valid
        myUserID && otherID && socket.current.emit('create-chat', {
            name: 'chatName',
            profile: '',
            userIDs: [myUserID, otherID],
            creationMessgae: `${userInfo.firstName} ${userInfo.lastName} created chat.`,
            type: 'private'
        }, (response) => {
            if (response.success) {
                toast('Chat created successfully!')
                router.push('/')
            } else {
                toast.error(response.message)
            }
        })
        isRequestSent.current = true
    };

    return (
        <div className="relative w-screen h-[100svh] flex flex-col items-center bg-white text-black dark:bg-gray-900 dark:text-white">
            <Navbar />

            <div className="w-11/12 max-w-md mt-10">
                <input
                    type="text"
                    placeholder="Search for people..."
                    className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <SearchedUser users={userList} searchQuery={searchQuery} onSelectUser={handleUserSelect} />
        </div>

    );
}
