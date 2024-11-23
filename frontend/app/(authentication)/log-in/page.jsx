"use client"

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { socketService } from "@/app/components/socket/SocketService";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";

export default function LogIn() {

    const router = useRouter()
    const socket = useRef(null)
    const [isAppActive, setIsAppActive] = useState(false)



    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()

        // show app only after getting response from backend
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
        axios.get(BACKEND_URL + '/test')
            .then(() => {
                setIsAppActive(true)
            })


    }, [])


    // Log in
    const logIn = (email, password) => {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                localStorage.setItem('chat3UserInfo', user)
                // redirect to main page
                router.push('/')
            })
            .catch((error) => {
                console.error("Error logging in: ", error.message);
                toast('Invalid credentials')
            });
    };

    function handleLogin(e) {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        logIn(email, password)
    }


    return (
        isAppActive ? <div className="w-screen h-100svh flex flex-col gap-20 justify-center items-center bg-white text-black">
            <form onSubmit={handleLogin} className="w-4/5 max-w-64 flex flex-col justify-center items-center gap-5">
                <h1 className="font-bold text-xl">Login</h1>
                <input className="px-5 py-3 w-full bg-gray-300 rounded-lg" name="email" type="email" placeholder="email" />
                <input className="px-5 py-3 w-full bg-gray-300 rounded-lg" name="password" type="password" placeholder="password" />
                <button className="px-5 py-3 text-white rounded-lg bg-blue-700" type="submit" >Login</button>
                <button onClick={() => router.push('/sign-up')} className="text-xs hover:text-blue-400 underline underline-offset-2">Dont have an acocunt? Sign up here.</button>
            </form>

            <div className="fixed bottom-3 right-3">
                <ToastContainer position="bottom-right" theme="light" />

            </div>

        </div> 
        :
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
            <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-lg font-semibold text-gray-600">Connecting to the server...</p>
            </div>
        </div>

    )
}