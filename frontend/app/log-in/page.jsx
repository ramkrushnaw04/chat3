"use client"
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { socketService } from "../components/socket/SocketService";


export default function LogIn() {

    const router = useRouter()
    const socket = useRef(null)

    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()

        return () => {

        }
    }, [])


    // Log in
    const logIn = (email, password) => {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("User logged in:", user);
                localStorage.setItem('chat3UserInfo', user)

                // send data to backend to save
                socket.current.emit('log-in', user)

                // redirect to main page
                router.push('/')

            })
            .catch((error) => {
                console.error("Error logging in:", error.message);
            });
    };

    function handleLogin(e) {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        logIn(email, password)
    }


    return (
        <div className="w-screen h-100svh flex flex-col gap-20 justify-center items-center bg-white text-black">

            {/* <h1 className="text-4xl font-extrabold ">Application name</h1> */}


            <form onSubmit={handleLogin} className="flex flex-col justify-center items-center gap-5">
                <h1 className="font-bold text-xl">Login</h1>
                <input className="px-5 py-3 bg-gray-300 rounded-lg" name="email" type="email" placeholder="email" />
                <input className="px-5 py-3 bg-gray-300 rounded-lg" name="password" type="password" placeholder="password" />
                <button className="px-5 py-3 text-white rounded-lg bg-blue-700" type="submit" >Login</button>
                <button onClick={() => router.push('/sign-up')} className="text-xs hover:text-blue-400 underline underline-offset-2">Dont have an acocunt? Sign up here.</button>
            </form>

        </div>
    )
}