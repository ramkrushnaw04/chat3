"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { socketService } from "./socket/SocketService";

export default function GroupCreation({ selectedUsers, onBack }) {
    const router = useRouter();
    const [groupName, setGroupName] = useState("");
    const [groupIcon, setGroupIcon] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const socket = useRef(null)

    useEffect(() => {
        socketService.connect()
      socket.current = socketService.getSocket()
    
      return () => {

      }
    }, [])
    

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
            if (validImageTypes.includes(file.type)) {
                setGroupIcon(file);
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
        const userIDs = selectedUsers.map(user => user._id);
        socket.current.emit('create-chat', { name: groupName, profile: groupIcon, userIDs, type: 'group' }, (response) => {
            if(response.success) {
                setGroupIcon(null)
                setGroupName('')
                setImagePreview(null)
                router.push('/')
            }
        })
    };

    return (
        <div className="relative w-screen h-screen flex flex-col items-center bg-white text-black">
            <button onClick={onBack} className="absolute top-4 left-4 text-gray-600">
                <AiOutlineArrowLeft className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold mt-10">Create Group</h1>

            <div className="w-11/12 max-w-md mt-6">
                <input
                    type="text"
                    placeholder="Group Name"
                    className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                />
            </div>

            <div className="mt-4 w-11/12 max-w-md flex flex-col items-center">
                <label className="block mb-2">Select Group Icon:</label>
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
                        className="flex items-center justify-center w-full p-4 border border-gray-300 rounded-lg shadow-md bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition duration-200"
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
                <h2 className="font-semibold">Members:</h2>
                {selectedUsers.map(user => (
                    <div key={user._id} className="flex items-center space-x-2 p-2 border border-gray-300 rounded-full bg-gray-100">
                        <img src={user.profile} alt={user.name} className="w-8 h-8 rounded-full" />
                        <span className="text-sm">{user.name}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={handleCreateGroup}
                disabled={!groupName || selectedUsers.length === 0}
                className={`absolute bottom-6 w-11/12 max-w-md px-6 py-2 font-semibold rounded-md transition duration-200 ${
                    groupName && selectedUsers.length > 0 ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
                Create Group
            </button>
        </div>
    );
}
