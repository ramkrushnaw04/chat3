"use client"
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";



export default function SignUp() {

    const router = useRouter()

    
    // Sign up
    const signUp = (email, password) => {
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("User signed up:", user);
                localStorage.setItem('chat3UserInfo', user)
                router.push('/')

            })
            .catch((error) => {
                console.error("Error signing up:", error.message);
            });
    };

    function handleSignup(e) {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        signUp(email, password)
    }


    return (
        <div className="w-screen h-100svh flex flex-col gap-20 justify-center items-center bg-white text-black">

            {/* <h1 className="text-4xl font-extrabold ">Application name</h1> */}


            <form onSubmit={handleSignup} className="flex flex-col justify-center items-center gap-5">
                <h1 className="font-bold text-xl">Sign Up</h1>
                <input className="px-5 py-3 bg-gray-300 rounded-lg" name="email" type="email" placeholder="email" />
                <input className="px-5 py-3 bg-gray-300 rounded-lg" name="password" type="password" placeholder="password" />
                <button className="px-5 py-3 text-white rounded-lg bg-blue-700" type="submit" >Login</button>
                <button onClick={() => router.push('/log-in')} className="text-xs hover:text-blue-400 underline underline-offset-2">Already have an acocunt? Log in here.</button>
            </form>

        </div>
    )
}