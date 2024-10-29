import React from 'react';

const SearchedUser = ({ users, searchQuery, onSelectUser }) => {
    const filteredUsers = users.filter(user =>
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mt-5 w-11/12 max-w-md ">
            {filteredUsers.length > 0 ? (
                <ul className="bg-white rounded-lg shadow-md ">
                    {filteredUsers.map(user => (
                        <li
                            key={user._id}
                            className="flex items-center p-4 border-b hover:bg-gray-100 transition duration-200 cursor-pointer"
                            onClick={() => onSelectUser(user)}
                        >
                            <img
                                src={user.profile == '' ? '/images/blank-profile-picture.webp' : user.profile}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-12 h-12 rounded-full mr-4"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-lg">{`${user.firstName} ${user.lastName}`}</span>
                                <span className="text-sm text-gray-600">{user.email}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500">No users found.</p>
            )}
        </div>
    );
};

export default SearchedUser;
