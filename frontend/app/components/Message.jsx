// components/Message.js
import React from 'react';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';

const Message = ({ message, isSentByUser }) => {
  // Determine the icon based on message status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <FaCheck className="text-gray-400" />; // Single check mark for "sent"
      case 'delivered':
        return <FaCheckDouble className="text-gray-400" />; // Double check marks for "delivered"
      case 'read':
        return <FaCheckDouble className="text-blue-500" />; // Double check marks in blue for "read"
      default:
        return null;
    }
  };

  return (
    <div className={`message mb-2 ${isSentByUser ? 'text-right' : 'text-left'}`}>
      <div className="inline-block px-3 py-2 rounded relative">
        <p
          className={`inline-block px-3 py-2 rounded ${
            isSentByUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
          }`}
        >
          {message.text}
        </p>
        {isSentByUser && (
          <span className="text-xs ml-2">
            {getStatusIcon(message.status)}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;
