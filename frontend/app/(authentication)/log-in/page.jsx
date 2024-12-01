"use client"

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { socketService } from "@/app/components/socket/SocketService";
import { toast } from 'react-toastify';
import axios from "axios";
import { signInWithPopup } from "firebase/auth";
import Image from "next/image";

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
        if(!email || !password) return
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

    function googleSignIn() {
        signInWithPopup(auth, provider)
            .then(data => {
                const user = data.user
                localStorage.setItem('chat3UserInfo', user)
                // redirect to main page
                router.push('/')
            })
            .catch((error) => {
                console.error("Error logging in: ", error.message);
                toast('Not signed in')
            });
    }


    return (
        isAppActive ? (
            <div className="w-screen h-[100svh] flex flex-col gap-20 justify-center items-center bg-white text-black dark:bg-gray-800 dark:text-white">
                <form onSubmit={handleLogin} className="w-4/5 max-w-64 flex flex-col justify-center items-center gap-5">
                    <h1 className="font-bold text-xl">Login</h1>
                    <input className="px-5 py-3 w-full bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-none" name="email" type="email" placeholder="email" />
                    <input className="px-5 py-3 w-full bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-none" name="password" type="password" placeholder="password" />
                    <button className="px-5 py-3 text-white rounded-lg bg-blue-700 dark:bg-blue-600" type="submit">Login</button>
                    <button onClick={() => router.push('/sign-up')} className="text-xs hover:text-blue-400 underline underline-offset-2 dark:hover:text-blue-300">Don&rsquo;t have an account? Sign up here.</button>
                    <button className="w-full p-3 bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white flex justify-center items-center gap-3" onClick={googleSignIn}>
                        <Image alt="google logo" width={20} height={20} src={'/images/search.png'} />
                        <p>Continue with google</p>
                    </button>
                </form>
            </div>
        ) : (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50 dark:bg-gray-900">
                <div className="flex items-center justify-center gap-2">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Connecting to the server...</p>
                </div>
            </div>
        )        

    )
}