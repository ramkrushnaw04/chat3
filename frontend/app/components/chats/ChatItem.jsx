// ChatsItem.js
import React from 'react';

const ChatsItem = ({ data, isOnline, onClick }) => {
    return (
        <div onClick={onClick} className="flex items-center p-4 cursor-pointer hover:bg-gray-200 rounded-lg transition">
            <div className="relative">
                <img src={data.profile} alt={`${data.name}`} className="w-12 h-12 rounded-full object-cover" />
                <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                ></span>
            </div>
            <div className="ml-4 flex gap-3 ">
                <span className="font-medium text-gray-900">{data.name}</span>
            </div>
        </div>
    );
};

export default ChatsItem;
