'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/NavBar';
import { setUserInfo } from '../store/slices/userSlice';
import { socketService } from '../components/socket/SocketService';
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useTheme } from 'next-themes';

const Profile = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);
    const userInfo = useSelector((state) => state.user.userInfo);
    const dispatch = useDispatch();
    const socket = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        profile: '',
    });
    const [previewImage, setPreviewImage] = useState('');
    const [isAppActive, setIsAppActive] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        axios.get(BACKEND_URL + '/test').then(() => setIsAppActive(true));
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('chat3UserInfo');
        if (!user && !storedUser) {
            router.push('/log-in');
        } else if (user && socket.current) {
            socket.current.emit(
                'get-user-info-form-authID',
                { authID: user.uid },
                (response) => {
                    if (response) {
                        dispatch(setUserInfo(response));
                        localStorage.setItem('chat3UserInfo', JSON.stringify(response));
                        setFormData({
                            firstName: response.firstName,
                            lastName: response.lastName,
                            email: response.email,
                            profile: response.profile,
                        });
                        setPreviewImage(response.profile);
                    }
                }
            );
        }
    }, [user, socket.current, dispatch]);

    const toggleDarkMode = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return isAppActive ? (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col">
            <Navbar />
            <div className="flex flex-col items-center justify-center mt-12">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-11/12 max-w-96 p-8 flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                        Welcome, {userInfo.firstName} {userInfo.lastName}
                    </h1>
                    {userInfo && (
                        <>
                            <img
                                src={userInfo.profile || "images/user-profile.jpg"}
                                alt={`${userInfo.firstName} ${userInfo.lastName}`}
                                className="w-36 h-36 rounded-full mb-6 shadow-lg"
                            />
                            <h2 className="text-xl font-semibold mb-1">
                                {userInfo.firstName} {userInfo.lastName}
                            </h2>
                            <p className="text-base text-gray-600 dark:text-gray-400">{userInfo.email}</p>
                        </>
                    )}

                    <button
                        onClick={toggleDarkMode}
                        className="mt-9 w-full py-2 text-gray-500 dark:text-gray-300 border border-gray-500 dark:border-gray-300 font-semibold rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        Change theme
                    </button>

                    <button
                        className="w-full py-2 mt-4 text-blue-500 dark:text-blue-300 border border-blue-500 dark:border-blue-300 font-semibold rounded-lg shadow-md hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit Profile
                    </button>

                    <button
                        onClick={() => {
                            localStorage.removeItem('chat3UserInfo');
                            socketService.disconnect();
                            signOut(auth);
                            router.push('/log-in');
                        }}
                        className="mt-3 w-full py-2 text-red-500 dark:text-red-300 border border-red-500 dark:border-red-300 font-semibold rounded-lg shadow-md hover:bg-red-100 dark:hover:bg-red-800 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Connecting to the server...</p>
            </div>
        </div>
    );
};

export default Profile;
