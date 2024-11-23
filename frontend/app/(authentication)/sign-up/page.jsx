"use client"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { socketService } from "../../components/socket/SocketService";
import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUserInfo } from "@/app/store/slices/userSlice";


export default function SignUp() {

    const router = useRouter()
    const socket = useRef(null)
    const dispatch = useDispatch()
    const [profileImage, setProfileImage] = useState(null)

    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()
    }, [])
    
    // Sign up
    const signUp = async (email, password, firstName, lastName, profileImage) => {
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
            })
            .catch((error) => {
                console.error("Error signing up:", error.message);
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
                setProfileImage(reader.result); // Set the base64 string for the image
            };
            reader.readAsDataURL(file); // Convert image to base64
        }
    }

    return (
        <div className="w-screen h-100svh flex flex-col gap-20 justify-center items-center bg-white text-black">
            <form onSubmit={handleSignup} className="flex w-4/5 max-w-64 flex-col justify-center items-center gap-5">
                <h1 className="font-bold text-xl">Sign Up</h1>
                <div className="w-32 h-32 my-5">
                    <input id="profileSelector" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <label htmlFor="profileSelector" >
                        <img src={profileImage || "images/blank-profile-picture.webp"} className="w-full h-full rounded-3xl cursor-pointer" alt="Profile" />
                    </label>
                </div>
                <input className="px-5 py-3 w-full bg-gray-300 rounded-lg" name="firstName" type="text" placeholder="First Name" required />
                <input className="px-5 py-3 w-full bg-gray-300 rounded-lg" name="lastName" type="text" placeholder="Last Name" required />
                <input className="px-5 py-3 w-full bg-gray-300 rounded-lg" name="email" type="email" placeholder="Email" required />
                <input className="px-5 py-3 w-full bg-gray-300 rounded-lg" name="password" type="password" placeholder="Password" required />
                <button className="px-5 py-3 text-white rounded-lg bg-blue-700" type="submit">Sign Up</button>
                <button onClick={() => router.push('/log-in')} className="text-xs hover:text-blue-400 underline underline-offset-2">Already have an account? Log in here.</button>
            </form>
        </div>
    )
}
