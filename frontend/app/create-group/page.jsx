"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import { useEffect, useRef, useState } from "react";
import { socketService } from "../components/socket/SocketService";
import SearchedUser from "../components/addChat/SearchedUser";
import { useSelector } from "react-redux";
import { AiOutlineClose } from "react-icons/ai";
import GroupCreation from "../components/GroupCreation";

export default function Chats() {
    const router = useRouter();
    let [currentUser] = useAuthState(auth);
    const storedUserData = localStorage.getItem('chat3UserInfo');
    const socket = useRef(null);
    const [userList, setUserList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedGroupUsers, setSelectedGroupUsers] = useState([]); 
    const [isCreatingGroup, setIsCreatingGroup] = useState(false); 

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);

    useEffect(() => {
        socket.current.emit('get-users-from-query', { query: searchQuery || "" }, (response) => {
            setUserList(response);
        });
    }, [searchQuery]);

    if (!currentUser && !storedUserData) {
        router.push('/log-in');
    } else {
        currentUser = storedUserData;
    }

    const handleUserSelect = (user) => {
        setSelectedGroupUsers(prevSelectedUsers => [...prevSelectedUsers, user]); 
        setSearchQuery("");
    };

    const handleRemoveUser = (userId) => {
        setSelectedGroupUsers(prevSelectedUsers => 
            prevSelectedUsers.filter(user => user._id !== userId) 
        );
    };

    const handleProceed = () => {
        setIsCreatingGroup(true); 
    };

    const handleBack = () => {
        setIsCreatingGroup(false);
    };

    // Get user details for selected user IDs
    const selectedUsersDetails = userList.filter(user => 
        selectedGroupUsers.map(u => u._id).includes(user._id)
    );

    return (
        <div className="relative w-screen h-screen flex flex-col items-center bg-white text-black">
            <Navbar />

            {isCreatingGroup ? (
                <GroupCreation selectedUsers={selectedGroupUsers} onBack={handleBack} /> // Render new component
            ) : (
                <>
                    <div className="w-11/12 max-w-md mt-10">
                        <input
                            type="text"
                            placeholder="Search for people..."
                            className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Selected Users Row */}
                    <div className="w-11/12 max-w-md flex flex-wrap items-center gap-2 mt-4 p-2">
                        {selectedUsersDetails.length > 0 ? (
                            selectedUsersDetails.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center space-x-2 p-2 border border-gray-300 rounded-full bg-gray-100"
                                >
                                    <img src={user.profile} alt={user.name} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm">{user.name}</span>
                                    <button onClick={() => handleRemoveUser(user._id)} className="text-gray-500 hover:text-gray-700">
                                        <AiOutlineClose className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <span className="text-gray-500">No selected users</span>
                        )}
                    </div>

                    {/* Show all users or filtered users */}
                    <SearchedUser users={userList} searchQuery={searchQuery} onSelectUser={handleUserSelect} />

                    {/* Proceed Button */}
                    <button
                        onClick={handleProceed}
                        disabled={selectedUsersDetails.length === 0}
                        className={`absolute bottom-6 w-11/12 max-w-md px-6 py-2 font-semibold rounded-md transition duration-200 ${
                            selectedUsersDetails.length > 0 ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        Proceed
                    </button>
                </>
            )}
        </div>
    );
}
