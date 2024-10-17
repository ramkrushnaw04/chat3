"use client"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";


export default function Home() {

    const router = useRouter()
    let [user] = useAuthState(auth)
    const storedUser = localStorage.getItem('chat3UserInfo')


    if(!user && !storedUser)
        router.push('/log-in')
    else
        user = storedUser
    

    return (
        <div>
            <Navbar />
            {/* <button onClick={() => signOut(auth)}>sign out</button> */}

        </div>
    );
}
