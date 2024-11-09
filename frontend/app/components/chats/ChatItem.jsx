import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const ChatsItem = ({ data, isOnline, onClick }) => {
    const storedMessages = useSelector((state) => state.messages);
    const [pendingMessages, setPendingMessages] = useState(0);

    // Set pending messages in this chat
    useEffect(() => {
        setPendingMessages(storedMessages.pendingMessages[data.chatID]?.length || 0);
    }, [storedMessages, data]);

    return (
        <div 
            onClick={onClick} 
            className="flex items-center p-4 cursor-pointer hover:bg-gray-200 bg-gray-100 rounded-lg transition justify-between"
        >
            <div className="flex items-center">
                <div className="relative">
                    <img src={data.profile} alt={'ICON'} className="w-12 h-12 rounded-full object-cover" />
                    {/* <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                    ></span> */}
                </div>
                <div className="ml-4 flex gap-3">
                    <span className="font-medium text-gray-900">{data.name}</span>
                </div>
            </div>

            {pendingMessages > 0 && (
                <div className="flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold">
                        {pendingMessages}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ChatsItem;
