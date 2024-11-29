import React, { useState, useRef, useEffect } from 'react';
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi';
import { addNewMessage, setReplyingToMessage } from '@/app/store/slices/messagesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../socket/SocketService';
import { v4 } from 'uuid';
import {
    FaCheck, FaCheckDouble, FaRegClock, FaFilePdf, FaVideo, FaFileImage,
    FaFileAudio, FaDownload, FaEye, FaReply,
    FaAudible,
    FaFile
} from 'react-icons/fa';


function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

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
    const replyingTo = useSelector(state => state.messages.replyingTo)
    const textareaRef = useRef(null);

    function handleResize(e) {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
        }
    }


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
            readBy: [],
            repliedTo: replyingTo
        };
        hideTypingIndicator();
        socket.current.emit('message', { room: activeChatID, messageData });
        dispatch(addNewMessage({ chatID: activeChatID, message: messageData }));
        setMessage('');
        dispatch(setReplyingToMessage(null))
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
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
                file: fileData,
                repliedTo: replyingTo
            }
            socket.current.emit('message', { room: activeChatID, messageData: messageWithFile });

            dispatch(addNewMessage({ chatID: activeChatID, message: messageWithFile }));
            setSelectedFile(null); // clear selected file
            setShowConfirmation(false); // hide confirmation screen
            setFileMessage(""); // Clear the message input
            dispatch(setReplyingToMessage(null))
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
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
    {/* Replying Message Display */}
    {replyingTo && (
        <div className="replied-message relative bg-gray-100 dark:bg-gray-800 p-2 h-auto flex gap-2 items-center w-full">
            <p className='text-xs px-2 py-1 rounded-xl bg-blue-300 dark:bg-blue-600 min-w-fit self-start text-gray-900 dark:text-gray-100'>
                Replying to: 
            </p>
            <div className="flex items-center w-full mr-5">
                {!replyingTo.file && (
                    <span className="text-sm text-gray-700 dark:text-gray-300 max-h-24 overflow-y-scroll break-words break-all w-full">
                        {replyingTo.text}
                    </span>
                )}
                {replyingTo.file && replyingTo.file.type.startsWith('image') && (
                    <div className="flex items-center">
                        <img
                            src={replyingTo.file.content}
                            alt="Replied Image"
                            className="w-10 h-10 object-cover mr-2 rounded-md"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{replyingTo.text || "Image"}</span>
                    </div>
                )}
            </div>
            {/* cross button */}
            <button
                className="ml-2 absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => dispatch(setReplyingToMessage(null))}
            >
                <FiX size={16} />
            </button>
        </div>
    )}

    <form onSubmit={handleSendMessage} className="input-area flex border dark:border-gray-800 m-2 rounded-lg gap-2 items-center p-2 ">
        <label
            htmlFor="file-upload"
            className="media-btn  bg-blue-600 dark:bg-blue-900 dark:hover:bg-blue-950 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-blue-700 cursor-pointer flex justify-center items-center w-10 h-10"
        >
            <FiPaperclip size={18} color="white" />
        </label>
        <input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            className="hidden"
        />
        <textarea
            value={message}
            onChange={(e) => {
                setMessage(e.target.value);
                showTypingIndicator();
                handleResize(e); // Adjust height dynamically
            }}
            placeholder="Type a message..."
            rows={1}
            ref={textareaRef}
            className="flex-1 p-2 focus:outline-none h-auto resize-none overflow-y-scroll bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            style={{ lineHeight: "1.5", minHeight: "40px" }} 
            onKeyDown={(e) => {
                if(e.code == 'Enter' && e.shiftKey)
                    handleSendMessage(e)
            }}
        />

        <button type="submit" className="send-btn bg-blue-600 dark:bg-blue-900 dark:hover:bg-blue-950 hover:bg-blue-700 flex justify-center items-center text-white w-10 h-10 rounded-lg">
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
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm File</h2>
                    <button
                        onClick={() => setShowConfirmation(false)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <FiX size={20} />
                    </button>
                </div>
                <div className="mb-4 flex-col flex gap-4">
                    <div >
                        {selectedFile.type == 'application/pdf' && <FaFilePdf className='w-10 h-10 text-pink-600' />}
                        {selectedFile.type.startsWith('audio') && <FaAudible className='w-10 h-10 text-blue-600' />}
                        {selectedFile.type.startsWith('video') && <FaVideo className='w-10 h-10 text-green-600' />}
                        {selectedFile.type == '' && <FaFile className='w-10 h-10 text-yellow-600' />}
                    </div>
                    <p><strong>File Name:</strong> {selectedFile.name}</p>
                    <p><strong>File Size:</strong> {formatBytes(selectedFile.size)}</p>
                </div>

                {/* Text field for file message */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={fileMessage}
                        onChange={(e) => setFileMessage(e.target.value)}
                        placeholder="Add a message with the file"
                        className="w-full p-2 border rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                    />
                </div>

                <button
                    onClick={handleSendFile}
                    className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700"
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
