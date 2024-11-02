
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import messagesReducer from './slices/messagesSlice'
import onlineUsersReducer from './slices/onlineUsersSlice'

const store = configureStore({
    reducer: {
        user: userReducer,
        messages: messagesReducer,
        onlineUsers: onlineUsersReducer
    }
});

export default store;
