import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";

// import icons
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { socketService } from "./socket/SocketService";
import { useSelector } from "react-redux";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const router = useRouter();
    const userInfo = useSelector(state => state.user.userInfo)

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleClickOutside = (event) => {
        if (
            menuRef.current && 
            !menuRef.current.contains(event.target) && 
            buttonRef.current && 
            !buttonRef.current.contains(event.target)
        ) {
            setMenuOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <nav className="flex relative w-full items-center justify-between py-4 px-5 text-black h-fit bg-white">
            <button onClick={() => router.push('/')} className="text-2xl font-bold text-gray-800"> Chat3 </button>

            <div className=" flex items-center space-x-2">
                

                <button
                    ref={buttonRef}
                    onClick={() => router.push('/profile')}
                    className="rounded-lg text-blue-600 focus:outline-none w-10">
                        <img src={userInfo.profile || 'images/user-profile.avif'}  className='w-full h-full rounded-full' alt="" />
                    {/* <FaUser /> */}
                </button>

                {/* {menuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute top-20 right-4 mt-2 w-40 bg-white shadow-lg rounded-lg p-2 z-10">
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => {
                                        router.push('/profile')
                                    }}
                                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center space-x-2">
                                    <FaUser />
                                    <span>Profile</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('chat3UserInfo');
                                        socketService.disconnect()
                                        signOut(auth);
                                        router.push('/log-in')
                                    }}
                                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center space-x-2">
                                    <FaSignOutAlt />
                                    <span>Logout</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )} */}
            </div>
        </nav>
    );
};

export default Navbar;
