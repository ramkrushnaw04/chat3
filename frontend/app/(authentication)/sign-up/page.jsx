"use client"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, provider } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { socketService } from "../../components/socket/SocketService";
import { useRef, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserInfo } from "@/app/store/slices/userSlice";
import axios from "axios";
import { toast } from "react-toastify";
import { signInWithPopup } from "firebase/auth";
import Image from "next/image";

export default function SignUp() {

    const router = useRouter()
    const socket = useRef(null)
    const dispatch = useDispatch()
    const [profileImage, setProfileImage] = useState(null)
    const [isAppActive, setIsAppActive] = useState(false)
    const isRequestSent = useRef(false)

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
    
    // Sign up
    const signUp = async (email, password, firstName, lastName, profileImage) => {
        if (isRequestSent.current) {
            return
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;

                // Store the user in localStorage
                localStorage.setItem('chat3UserInfo', JSON.stringify(user))

                // Add first name, last name, and profile url
                await updateProfile(user, {
                    displayName: `${firstName} ${lastName}`,
                    // photoURL: profileImage 
                });

                // Send data to backend to save
                socket.current.emit('sign-up', { user, firstName, lastName, profileImage }, (response) => {
                    dispatch(setUserInfo(response))
                    router.push('/')
                });
                isRequestSent.current = true
            })
            .catch((error) => {
                console.error("Error signing up:", error.message);
                isRequestSent.current = false
                // toast.error(error.message)
            });
    };

    function handleSignup(e) {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        const firstName = e.target.firstName.value
        const lastName = e.target.lastName.value
        signUp(email, password, firstName, lastName, profileImage) 
    }

    function handleImageChange(e) {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file); 
        }
    }


    function googleSignUp() {
        signInWithPopup(auth, provider)
        .then(async (userCredential) => {
            const user = userCredential.user;

            // Store the user in localStorage
            localStorage.setItem('chat3UserInfo', JSON.stringify(user))

            let [firstName, lastName] = user.displayName.split(" "); 
            // Send data to backend to save
            socket.current.emit('sign-up', { 
                user,
                firstName: firstName || '',
                lastName: lastName || '',
            }, (response) => {
                if(response.status == 'duplicate') {
                    toast('User already exists.')
                    localStorage.removeItem('chat3UserInfo')
                    return
                }
                dispatch(setUserInfo(response))
                router.push('/')
            });
        })
        .catch((error) => {
            console.log(error)
            console.error("Error signing up:", error.message);
            toast.error(error.message)
        });
    }

    return (
        isAppActive ? (
            <div className="w-screen h-[100svh] flex flex-col gap-20 justify-center items-center bg-white text-black dark:bg-gray-800 dark:text-white">
                <form onSubmit={handleSignup} className="flex w-4/5 max-w-64 flex-col justify-center items-center gap-5">
                    <h1 className="font-bold text-xl">Sign Up</h1>
                    <div className="w-32 h-32 my-5">
                        <input id="profileSelector" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        <label htmlFor="profileSelector">
                            <img src={profileImage || "images/user-profile.jpg"} className="w-full h-full border-gray-200 border-2 rounded-3xl cursor-pointer dark:border-gray-600" alt="Profile" />
                        </label>
                    </div>
                    <input className="px-5 py-3 w-full bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white" name="firstName" type="text" placeholder="First Name" required />
                    <input className="px-5 py-3 w-full bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white" name="lastName" type="text" placeholder="Last Name" required />
                    <input className="px-5 py-3 w-full bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white" name="email" type="email" placeholder="Email" required />
                    <input className="px-5 py-3 w-full bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white" name="password" type="password" placeholder="Password" required />
                    <button className="px-5 py-3 text-white rounded-lg bg-blue-700 dark:bg-blue-600" type="submit">Sign Up</button>
                    <button onClick={() => router.push('/log-in')} className="text-xs hover:text-blue-400 underline underline-offset-2 dark:hover:text-blue-300">Already have an account? Log in here.</button>
                    <button className="w-full p-3 bg-gray-300 rounded-lg dark:bg-gray-700 dark:text-white flex justify-center items-center gap-3" onClick={googleSignUp}>
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
