'use client';

import React, { useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Navbar from '../components/NavBar';
import { setUserInfo } from '../store/slices/userSlice';
import { useDispatch } from 'react-redux';
import { socketService } from '../components/socket/SocketService';

const Profile = () => {
    const router = useRouter();
    let [user] = useAuthState(auth);
    const storedUser = localStorage.getItem('chat3UserInfo');
    const userInfo = useSelector((state) => state.user.userInfo);
    const dispatch = useDispatch()
    const socket = useRef(null)

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();

    }, []);


    if (!user && !storedUser) {
        router.push('/log-in');
    } else {
        socket.current && socket.current.emit('get-user-info-form-authID', { authID: user.uid }, (response) => {
            dispatch(setUserInfo(response))
            user = storedUser;
        })
    }

    
    
      
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex flex-col items-center justify-center mt-10">
                <div className="bg-white rounded-lg shadow-lg w-80 p-6 flex flex-col items-center">
                    <h1 className="text-xl font-bold text-gray-800 mb-4">Hello, {userInfo.firstName} {userInfo.lastName}</h1>
                    {userInfo && (
                        <>
                            <img
                                src={userInfo.profile}
                                alt={`${userInfo.firstName} ${userInfo.lastName}`}
                                className="w-32 h-32 rounded-full mb-4 border-2 border-blue-500"
                            />
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                {userInfo.firstName} {userInfo.lastName}
                            </h2>
                            <p className="text-lg text-gray-700">Email: {userInfo.email}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
