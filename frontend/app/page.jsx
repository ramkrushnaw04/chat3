"use client"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import { useEffect, useRef } from "react";
import { socketService } from "./components/socket/SocketService";
import { useRevalidator } from "react-router-dom";


export default function Home() {

    const router = useRouter()
    let [user] = useAuthState(auth)
    const storedUser = localStorage.getItem('chat3UserInfo')
    const socket = useRef(null)

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket()

        return () => {

        }
    }, [])



    if (!user && !storedUser) {
        router.push('/log-in')
    }
    else 
        user = storedUser


    return (
        <div>
            <Navbar />

        </div>
    );
}
