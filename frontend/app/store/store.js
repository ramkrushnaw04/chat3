
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import messagesReducer from './slices/messagesSlice'
import onlineUsersReducer from './slices/onlineUsersSlice'
import contactsReducer from './slices/contactsSlice'
import activeChatReducer from './slices/activeChatSlice'

const store = configureStore({
    reducer: {
        user: userReducer,
        messages: messagesReducer,
        onlineUsers: onlineUsersReducer,
        contacts: contactsReducer,
        activeChat: activeChatReducer
    }
});

export default store;
