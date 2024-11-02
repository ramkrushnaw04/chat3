// components/ChatHeader.js
import React, {useState, useEffect} from 'react';
import { AiOutlineArrowLeft } from "react-icons/ai";

const ChatHeaderGroup = ({ data, activeChatHandler }) => {

    const mobileWidth = 768
    const [mobile, setMobile] = useState(window.innerWidth < mobileWidth ? true : false)

    useEffect(() => {
        // for width calculation
        function handleResize() {
            setMobile(window.innerWidth < mobileWidth ? true : false)
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        };
    }, [])

    return (


        <div className="header flex items-center p-4 bg-white border-b">
            {mobile && <button className="mr-4" onClick={() => {
                activeChatHandler(null)
            }} > 
                <AiOutlineArrowLeft className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </button>
            }
            <div className="relative mr-4">
                <img src={data.profile} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                <span
                    className={`absolute bottom-[-2px] right-[-2px] w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                />
            </div>
            <div>
                <h2 className="font-semibold">{data.type == 'private' ? `${data.firstName} ${data.lastName}` : data.name}</h2>
                <p className="text-sm text-gray-400">
                    last seen: 12:43
                </p>
            </div>
        </div>

    );
}

export default ChatHeaderGroup;
