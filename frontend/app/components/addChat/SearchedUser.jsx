import React from 'react';
import { useSelector } from 'react-redux';

const SearchedUser = ({ users, searchQuery, onSelectUser }) => {
    const userInfo = useSelector((state) => state.user.userInfo)

    const filteredUsers =
        users
            .filter(user => user._id != userInfo._id)
            .filter(user =>
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );

    return (
        <div className="mt-5 w-11/12 max-w-md overflow-y-scroll pb-20 rounded-md">
            {filteredUsers.length > 0 ? (
                <ul className="bg-white shadow-md rounded-md dark:bg-transparent ">
                    {filteredUsers.map(user => (
                        <li
                            key={user._id}
                            className="flex items-center p-4 my-2 dark:bg-gray-800 border dark:border-none rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200 cursor-pointer"
                            onClick={() => onSelectUser(user)}
                        >
                            <img
                                src={user.profile == '' || !user.profile ? "images/user-profile.jpg" : user.profile}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-12 h-12 rounded-full mr-4"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-lg text-black dark:text-white">{`${user.firstName} ${user.lastName}`}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No users found.</p>
            )}
        </div>

    );
};

export default SearchedUser;
