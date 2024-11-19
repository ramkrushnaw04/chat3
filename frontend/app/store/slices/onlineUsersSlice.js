import { createSlice } from '@reduxjs/toolkit'

// format: onlineUsers: [userIDs of online users]
const initialState = {
    onlineUsers: []
}

export const userSlice = createSlice({
    name: 'user',
    initialState,

    reducers: {
        addOnlineUser: (state, action) => {
            const userID = action.payload.userID
            if(!state.onlineUsers.includes(userID))
                state.onlineUsers.push(userID);
        },
        addOnlineUsers: (state, action) => {
            for (const userID of action.payload) {
                if(!state.onlineUsers.includes(userID))
                    state.onlineUsers.push(userID);
            }
        },
        removeOnlineUser: (state, action) => {
            // state.onlineUsers.delete(action.payload.userID);
            const filteredUsers = state.onlineUsers.filter(item => item != action.payload.userID)
            state.onlineUsers = filteredUsers
        },
        clearOnlineUsers: (state) => {
            state.onlineUsers.clear();
        },
        
    }
})


export const { 
    addOnlineUser, 
    removeOnlineUser, 
    clearOnlineUsers,
    addOnlineUsers 
} = userSlice.actions

export default userSlice.reducer