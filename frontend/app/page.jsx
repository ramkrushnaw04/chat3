"use client"

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import { useEffect, useRef, useState } from "react";
import { socketService } from "./components/socket/SocketService";
import { BsChatDotsFill } from "react-icons/bs";
import { AiOutlineUserAdd, AiOutlineTeam } from "react-icons/ai";
import Chats from "./components/chats/Chats";
import { setUserInfo } from "./store/slices/userSlice";
import { useDispatch } from "react-redux";

export default function Home() {
    const router = useRouter();
    let [user] = useAuthState(auth);
    const storedUser = localStorage.getItem('chat3UserInfo');
    const socket = useRef(null);
    const [showOptions, setShowOptions] = useState(false);
    const dispatch = useDispatch()

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();

        return () => {
            socketService.disconnect();
        };
    }, []);

    if (!user && !storedUser) {
        router.push('/log-in');
    } else {
        socket.current && socket.current.emit('get-user-info-form-authID', {authID: user.uid}, (response) => {
            dispatch(setUserInfo(response))
            user = storedUser;
        })
    }

    const toggleOptions = () => setShowOptions(!showOptions);

    return (
        <div className="relative w-screen h-screen flex flex-col items-center bg-white text-black">
            <Navbar />

            <button
                onClick={toggleOptions}
                className="fixed bottom-4 right-4 w-10 h-10 bg-blue-500 hover:bg-blue-700 text-white flex items-center justify-center rounded-lg shadow-lg transition duration-200"
            >
                <BsChatDotsFill size={24} />
            </button>

            <Chats />

            {showOptions && (
                <div className="fixed bottom-20 p-2 bg-white text-black rounded-lg shadow-lg right-5 flex flex-col gap-3">
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
        </div>
    );
}
