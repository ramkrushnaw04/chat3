'use client';

import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { socketService } from "./socket/SocketService";
import { useSelector } from "react-redux";
import { useTheme } from "next-themes";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const router = useRouter();
    const userInfo = useSelector(state => state.user.userInfo);
    const { theme, setTheme } = useTheme();

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
        <nav className="flex relative w-full items-center justify-between py-4 px-5 bg-white text-black dark:bg-gray-900 dark:text-white">
            <button onClick={() => router.push('/')} className="text-2xl font-bold text-gray-800 dark:text-white"> Chat3 </button>

            <div className="flex items-center space-x-2">
                <button
                    ref={buttonRef}
                    onClick={() => router.push('/profile')}
                    className="rounded-lg focus:outline-none w-10">
                    <img 
                        src={userInfo.profile || 'images/user-profile.jpg'} 
                        className="w-full h-full rounded-full" 
                        alt="User Profile"
                    />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
