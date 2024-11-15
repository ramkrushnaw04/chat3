"use client"

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import { useEffect, useRef, useState } from "react";
import { socketService } from "./components/socket/SocketService";
import Chats from "./components/chats/Chats";
import { setUserInfo } from "./store/slices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import ChatBox from "./components/chatBox/ChatBox";

export default function Home() {
    const router = useRouter();
    let [user] = useAuthState(auth);
    const storedUser = localStorage.getItem('chat3UserInfo');
    const socket = useRef(null);
    const dispatch = useDispatch()
    const [activeChat, setActiveChat] = useState(null)
    const mobileWidth = 768
    const [mobile, setMobile] = useState(window.innerWidth < mobileWidth ? true : false)
    const userInfo = useSelector(state => state.user.userInfo)

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();


        // for width calculation
        function handleResize() {
            setMobile(window.innerWidth < mobileWidth ? true : false)
        }
        window.addEventListener('resize', handleResize)



        return () => {
            window.removeEventListener('resize', handleResize)
        };
    }, []);


    // if (!user && !storedUser) {
    //     router.push('/log-in');
    // } else {
    //     socket.current && socket.current.emit('get-user-info-form-authID', { authID: user.uid }, (response) => {
    //         dispatch(setUserInfo(response))
    //         user = storedUser;
    //     })
    // }


    useEffect(() => {
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
                }
            );
        }
    }, [user, storedUser, socket.current, dispatch]);


    function handleActiveChat(data) {
        setActiveChat(data)
    }


    return (
        <div className="relative w-screen h-100svh flex items-center bg-white text-black">

            <div className={`left  ${mobile ? (activeChat ? 'hidden' : 'flex') : 'flex'} md:flex relative w-full md:w-1/4 h-100svh flex-col border-r-[1px] border-r-gray-200`}>
                <Navbar />
                <Chats activeChatHandler={handleActiveChat} />
            </div>

            <div className={`right ${mobile ? (activeChat ? 'flex' : 'hidden') : 'flex'} md:flex w-full md:w-3/4 h-100svh`}>
                <ChatBox activeChat={activeChat} activeChatHandler={handleActiveChat} />
            </div>

        </div>

    );
}
