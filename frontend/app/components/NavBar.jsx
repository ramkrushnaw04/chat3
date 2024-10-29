import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";

// import icons
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { socketService } from "./socket/SocketService";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const router = useRouter();

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
        <nav className="flex w-screen items-center justify-between p-4 bg-white text-black shadow-md">
            <button onClick={() => router.push('/')} className="text-2xl font-bold text-gray-800"> Chat3 </button>

            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Search..."
                    className="p-2 w-32 bg-gray-200 text-black border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                />

                <button
                    ref={buttonRef}
                    onClick={toggleMenu}
                    className="bg-blue-500 p-2 rounded-lg text-white hover:bg-blue-700 focus:outline-none h-10 w-10 flex items-center justify-center">
                    <FaUser />
                </button>

                {menuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute top-20 right-4 mt-2 w-40 bg-white shadow-lg rounded-lg p-2">
                        <ul className="space-y-2">
                            <li>
                                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center space-x-2">
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
                                    }}
                                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center space-x-2">
                                    <FaSignOutAlt />
                                    <span>Logout</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
