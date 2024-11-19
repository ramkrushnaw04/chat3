'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/NavBar';
import { setUserInfo } from '../store/slices/userSlice';
import { socketService } from '../components/socket/SocketService';

const Profile = () => {
    const router = useRouter();
    let [user] = useAuthState(auth);
    const storedUser = localStorage.getItem('chat3UserInfo');
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
    const [previewImage, setPreviewImage] = useState(''); // Preview for uploaded image

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);

    useEffect(() => {
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
                        setPreviewImage(response.profile); // Set initial preview
                    }
                }
            );
        }
    }, [user, storedUser, socket.current, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Convert image to Base64
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result;
                setPreviewImage(base64String); // Update preview
                setFormData((prev) => ({
                    ...prev,
                    profile: base64String, // Update profile field with Base64 image
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (socket.current) {
            socket.current.emit('update-user-info', {_id: userInfo._id, update: formData}, (response) => {
                dispatch(setUserInfo(response));
                localStorage.setItem('chat3UserInfo', JSON.stringify(response));
                setIsEditing(false);
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex flex-col items-center justify-center mt-10">
                <div className="bg-white rounded-lg shadow-lg w-80 p-6 flex flex-col items-center">
                    <h1 className="text-xl font-bold text-gray-800 mb-4">
                        Hello, {userInfo.firstName} {userInfo.lastName}
                    </h1>
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
                    <button
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-96 p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Edit Profile</h2>
                        <div className="space-y-4 text-gray-600">
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="First Name"
                                className="w-full px-4 py-2 border rounded"
                            />
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Last Name"
                                className="w-full px-4 py-2 border rounded"
                            />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Email"
                                className="w-full px-4 py-2 border rounded"
                            />
                            <div className="flex flex-col items-center">
                                <label
                                    htmlFor="profile"
                                    className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition duration-200 my-2"
                                >
                                    Choose Image
                                </label>
                                <input
                                    type="file"
                                    id="profile"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />

                                {previewImage && (
                                    <img
                                        src={previewImage}
                                        alt="Profile Preview"
                                        className="w-24 h-24 rounded-full border-2 border-blue-500"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={handleSave}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
