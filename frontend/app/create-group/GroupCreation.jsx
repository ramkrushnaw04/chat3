"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { socketService } from "../components/socket/SocketService";
import { useSelector } from "react-redux";

export default function GroupCreation({ selectedUsers, onBack }) {
    const router = useRouter();
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const socket = useRef(null)
    const userInfo = useSelector((state) => state.user.userInfo)
    const isRequestSent = useRef(false)

    useEffect(() => {
        socketService.connect()
        socket.current = socketService.getSocket()
    }, [])


    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
            if (validImageTypes.includes(file.type)) {
                const reader = new FileReader();
                reader.onload = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                alert("Please select a valid image file (JPEG, PNG, GIF).");
            }
        }
    };

    const handleCreateGroup = () => {
        if (isRequestSent.current) return

        const userIDs = selectedUsers.map(user => user._id);
        userIDs.push(userInfo._id)
        socket.current.emit('create-chat', {
            name: groupName,
            profile: imagePreview,
            userIDs,
            description: groupDescription,
            type: 'group',
            creationMessgae: `${userInfo.firstName} ${userInfo.lastName} has created group '${groupName}'.`
        }, (response) => {
            if (response.success) {
                setGroupName('')
                setImagePreview(null)
                setGroupDescription('')
                router.push('/')
            }
        })
        isRequestSent.current = true
    };

    return (
        <div className="relative w-screen h-screen flex flex-col items-center bg-white text-black dark:bg-gray-900 dark:text-white">
            <button onClick={onBack} className="absolute top-4 left-4 text-gray-600 dark:text-gray-400">
                <AiOutlineArrowLeft className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold mt-10 dark:text-white">Create Group</h1>

            <div className="w-11/12 max-w-md mt-6">
                <input
                    type="text"
                    placeholder="Group Name"
                    className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                />
            </div>

            <div className="w-11/12 max-w-md mt-4">
                <textarea
                    placeholder="Group Description"
                    className="w-full p-4 border resize-none border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={3}
                />
            </div>

            <div className="mt-4 w-11/12 max-w-md flex flex-col items-center">
                <label className="block mb-2 dark:text-white">Select Group Icon:</label>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                    />
                    <label
                        htmlFor="image-upload"
                        className="flex items-center justify-center w-full p-4 border border-gray-300 rounded-lg shadow-md bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Selected"
                                className="w-full h-32 object-cover rounded-lg"
                            />
                        ) : (
                            "Upload Image"
                        )}
                    </label>
                </div>
            </div>

            <div className="mt-6 w-11/12 max-w-md flex flex-wrap items-center gap-2">
                <h2 className="font-semibold dark:text-white">Members:</h2>
                <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                    <img src={userInfo.profile || 'images/user-profile.jpg'} alt={userInfo.firstName} className="w-8 h-8 rounded-full" />
                    <span className="text-sm dark:text-white">You</span>
                </div>
                {selectedUsers.map(user => (
                    <div key={user._id} className="flex items-center space-x-2 p-2 border border-gray-300 rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                        <img src={user.profile} alt={user.firstName} className="w-8 h-8 rounded-full" />
                        <span className="text-sm dark:text-white">{user.firstName} {user.lastName}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={handleCreateGroup}
                disabled={!groupName || selectedUsers.length === 0}
                className={`absolute bottom-6 w-11/12 max-w-md px-6 py-2 font-semibold rounded-md transition duration-200 ${groupName && selectedUsers.length > 0 ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"}`}
            >
                Create Group
            </button>
        </div>

    );
}
