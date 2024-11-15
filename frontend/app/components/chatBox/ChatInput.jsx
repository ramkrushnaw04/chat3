import React, { useState, useRef, useEffect } from 'react';
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi';
import { addNewMessage } from '@/app/store/slices/messagesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../socket/SocketService';
import { v4 } from 'uuid';

const ChatInput = ({ activeChatID }) => {
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [errorMessage, setErrorMessage] = useState(""); // State to store error message
    const [filePreview, setFilePreview] = useState(null); // State to store file preview
    const [fileMessage, setFileMessage] = useState(""); // State to store the text message for the file
    const socket = useRef(null);
    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.user.userInfo);
    const typingTimeout = useRef(null);
    const isUserTyping = useRef(false);

    useEffect(() => {
        socketService.connect();
        socket.current = socketService.getSocket();
    }, []);

    function handleSendMessage(e) {
        e.preventDefault();
        if (!message || !message.trim() || !socket.current || !activeChatID) return;
        const messageData = {
            text: message,
            chatID: activeChatID,
            sentAt: Date.now(),
            senderID: userInfo._id,
            ID: v4(),
            status: '',
            readBy: []
        };
        hideTypingIndicator();
        socket.current.emit('message', { room: activeChatID, messageData });
        dispatch(addNewMessage({ chatID: activeChatID, message: messageData }));
        setMessage('');
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 16 * 1024 * 1024) {
                setErrorMessage("File size exceeds 16 MB. Please select a smaller file.");
                return;
            }
            setSelectedFile(file);
            setErrorMessage(""); // Clear any previous error messages
            setShowConfirmation(true);

            // Generate preview for image files
            if (file.type.startsWith('image')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                setFilePreview(null); // PDF preview could be handled later or show a generic preview
            } else {
                setFilePreview(null); // For other file types, no preview
            }
        }
    }

    function handleSendFile() {
        if (!selectedFile || !socket.current || !activeChatID) return;

        const reader = new FileReader();
        reader.onload = () => {
            const fileData = {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                content: reader.result, // base64 encoded 
            };

            const messageWithFile = {
                text: fileMessage, // Add the fileMessage to the message
                chatID: activeChatID,
                sentAt: Date.now(),
                senderID: userInfo._id,
                ID: v4(),
                status: '',
                readBy: [],
                file: fileData
            }
            console.log('sending file: ', messageWithFile)
            socket.current.emit('message', { room: activeChatID, messageData: messageWithFile }, (response) => {
                console.log(response);
            });

            dispatch(addNewMessage({ chatID: activeChatID, message: messageWithFile }));
            setSelectedFile(null); // clear selected file
            setShowConfirmation(false); // hide confirmation screen
            setFileMessage(""); // Clear the message input
        };
        reader.readAsDataURL(selectedFile);
    }

    function showTypingIndicator() {
        clearTimeout(typingTimeout.current);

        typingTimeout.current = setTimeout(() => {
            hideTypingIndicator();
        }, 1000);

        if (!isUserTyping.current) {
            socket.current.emit('user-typing', {
                userID: userInfo._id,
                groupID: activeChatID,
                action: 'started-typing',
                firstName: userInfo.firstName,
                lastName: userInfo.lastName
            });
            isUserTyping.current = true;
        }
    }

    function hideTypingIndicator() {
        clearTimeout(typingTimeout.current);
        socket.current.emit('user-typing', {
            userID: userInfo._id,
            groupID: activeChatID,
            action: 'stopped-typing',
            firstName: userInfo.firstName,
            lastName: userInfo.lastName
        });
        isUserTyping.current = false;
    }

    return (
        <>
            <form onSubmit={handleSendMessage} className="input-area flex items-center p-3 border-t">
                <label
                    htmlFor="file-upload"
                    className="media-btn mr-2 p-2 border bg-blue-500 rounded-md text-gray-700 hover:bg-gray-300 cursor-pointer"
                >
                    <FiPaperclip size={18} color="white" />
                </label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        showTypingIndicator();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-md focus:outline-none"
                />
                <button type="submit" className="send-btn ml-2 bg-blue-500 text-white p-2 rounded-md">
                    <FiSend size={18} />
                </button>
            </form>

            {/* Error Message */}
            {errorMessage && (
                <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
            )}

            {/* Confirmation Screen */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-10">
                    <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Confirm File</h2>
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p><strong>File Name:</strong> {selectedFile.name}</p>
                            <p><strong>File Type:</strong> {selectedFile.type || "Unknown"}</p>
                            <p><strong>File Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                        {/* File Preview Section */}
                        {filePreview ? (
                            <div className="mb-4">
                                <img src={filePreview} alt="file-preview" className="w-full h-40 object-cover rounded-md" />
                            </div>
                        ) : selectedFile.type === 'application/pdf' ? (
                            <div className="mb-4">
                                <p className="text-gray-500">PDF Preview (Not supported in this view)</p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-gray-500">No preview available for this file type</p>
                            </div>
                        )}

                        {/* Text field for file message */}
                        <div className="mb-4">
                            <input
                                type="text"
                                value={fileMessage}
                                onChange={(e) => setFileMessage(e.target.value)}
                                placeholder="Add a message with the file"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>

                        <button
                            onClick={handleSendFile}
                            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatInput;
