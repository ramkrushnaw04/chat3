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
import GroupCreation from "./GroupCreation";


export default function Page() {
    const router = useRouter();
    let [currentUser] = useAuthState(auth);
    const socket = useRef(null);
    const [userList, setUserList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const userInfo = useSelector((state) => state.user.userInfo);
    let [user] = useAuthState(auth);


    const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    const [groupName, setGroupName] = useState("");
    const [groupInfo, setGroupInfo] = useState(""); // New state for group info
    const [groupImage, setGroupImage] = useState(""); // State for group image (base64)

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);

    useEffect(() => {
        socket.current.emit('get-users-from-query', { query: searchQuery || "" }, (response) => {
            setUserList(response);
        });
    }, [searchQuery]);


    useEffect(() => {
        const storedUser = localStorage.getItem('chat3UserInfo');

        if (!currentUser && !storedUser) {
            router.push('/log-in');
        }
    }, [currentUser]);


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

    // Handle image change and convert to base64
    const handleGroupImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupImage(reader.result); // base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    // Get user details for selected user IDs
    const selectedUsersDetails = userList.filter(user =>
        selectedGroupUsers.map(u => u._id).includes(user._id)
    );

    return (
        <div className="relative w-screen h-100svh flex flex-col items-center bg-white text-black dark:bg-gray-900 dark:text-white">
            <Navbar />

            {isCreatingGroup ? (
                <GroupCreation
                    selectedUsers={selectedGroupUsers}
                    groupName={groupName}
                    groupInfo={groupInfo}
                    groupImage={groupImage} // Pass the base64 image to GroupCreation component
                    onGroupNameChange={(e) => setGroupName(e.target.value)}
                    onGroupInfoChange={(e) => setGroupInfo(e.target.value)} // Pass function to handle group info change
                    onGroupImageChange={handleGroupImageChange} // Handle group image change
                    onBack={handleBack}
                />
            ) : (
                <>
                    <div className="w-11/12 max-w-md mt-10">
                        <input
                            type="text"
                            placeholder="Search for people..."
                            className="w-full p-4 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Selected Users Row */}
                    <div className="w-11/12 max-w-md flex flex-wrap items-center gap-2 mt-4 p-2">
                        <div
                            className="flex items-center space-x-2 p-2 border border-gray-300 rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                        >
                            <img src={userInfo.profile || 'images/user-profile.jpg'} alt="YOU" className="w-8 h-8 rounded-full" />
                            <span className="text-sm">You</span>
                        </div>

                        {selectedUsersDetails.length > 0 ? (
                            selectedUsersDetails.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center space-x-2 p-2 border border-gray-300 rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <img src={user.profile || 'images/user-profile.jpg'} alt={user.firstName} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm">{user.firstName + ' ' + user.lastName}</span>
                                    <button onClick={() => handleRemoveUser(user._id)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-500">
                                        <AiOutlineClose className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <span className="text-gray-500 ml-4 dark:text-gray-400">Select more people</span>
                        )}
                    </div>

                    {/* Show all users or filtered users */}
                    <SearchedUser users={userList} searchQuery={searchQuery} onSelectUser={handleUserSelect} />

                    {/* Proceed Button */}
                    <button
                        onClick={handleProceed}
                        disabled={selectedUsersDetails.length === 0}
                        className={`absolute bottom-6 w-11/12 max-w-md px-6 py-2 font-semibold rounded-md transition duration-200 ${selectedUsersDetails.length > 0 ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"}`}
                    >
                        Proceed
                    </button>
                </>
            )}
        </div>

    );
}
