'use client';

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import { useEffect, useRef, useState } from "react";
import { socketService } from "./components/socket/SocketService";
import Chats from "./components/chats/Chats";
import { setUserInfo } from "./store/slices/userSlice";
import { useDispatch } from "react-redux";
import ChatBox from "./components/chatBox/ChatBox";
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

export default function Home() {
    const router = useRouter();
    let [user] = useAuthState(auth);
    const socket = useRef(null);
    const dispatch = useDispatch()
    const [activeChat, setActiveChat] = useState(null)
    const mobileWidth = 768
    const [mobile, setMobile] = useState(false)
    const [isAppActive, setIsAppActive] = useState(false)

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
        // for width calculation
        function handleResize() {
            setMobile(window.innerWidth < mobileWidth ? true : false)
        }
        handleResize() // to resize the window when applicaiton is loaded
        window.addEventListener('resize', handleResize)

        // show app only after getting response from backend
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
        axios.get(BACKEND_URL + '/test')
            .then(() => {
                setIsAppActive(true)
            })

        return () => {
            window.removeEventListener('resize', handleResize)
        };
    }, []);


    useEffect(() => {
        const storedUser = localStorage.getItem('chat3UserInfo');

        if (!user && !storedUser) {
            router.push('/log-in');
        } else if (user && socket.current) {
            socket.current.emit(
                'get-user-info-form-authID',
                { authID: user.uid },
                (response) => {
                    if (response) {
                        dispatch(setUserInfo(response));
                        localStorage.setItem('chat3UserInfo', JSON.stringify(response));
                    }
                    else {
                        // console.log('user aready logged in on another ')
                        router.push('/log-in');
                        // toast("Error loggin in, please login again.")
                    }
                }
            );
        }
    }, [user]);


    function handleActiveChat(data) {
        setActiveChat(data)
    }


    return (
        isAppActive ? <div className="relative w-screen h-100svh flex items-center bg-white dark:bg-gray-900 text-black dark:text-white">

            <div className={`left  ${mobile ? (activeChat ? 'hidden' : 'flex') : 'flex'} md:flex relative w-full md:w-[350px] h-100svh flex-col border-r-[1px] border-r-gray-200 dark:border-gray-800`}>
                <Navbar />
                <Chats activeChatHandler={handleActiveChat} />
            </div>

            <div className={`right ${mobile ? (activeChat ? 'block' : 'hidden') : 'block w-[calc(100%-350px)]'} w-full h-100svh`}>
                <ChatBox activeChat={activeChat} activeChatHandler={handleActiveChat} />
            </div>

        </div> 
        : <div className="fixed inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-50">
            <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Connecting to the server...</p>
            </div>
        </div>
    );
}
