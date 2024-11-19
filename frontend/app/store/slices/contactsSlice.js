// stores all the other users in the application

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    lastOnline: {

    }
}

export const contactsSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        addContactInfos: (state, action) => {
            // data: {userID: userInfoJSON}
            const users = Object.entries(action.payload)
            for (const [userID, userInfo] of users) {
                if(!state[userID]) 
                    state[userID] = userInfo
            }
        },
        setLastOnlineStatuses: (state, action) => {
            state.lastOnline = action.payload
        },
        addLastOnlineStatuses: (state, action) => {
            const entries = Object.entries(action.payload)
            for (const [key, value] of entries) {
                if(!state.lastOnline[key])
                    state.lastOnline[key] = value
            }
        },
        addLastOnlineStatus: (state, action) => {
            state.lastOnline[action.payload.userID] = action.payload.lastOnline
        },
        removeLastOnlineStatus: (state, action) => {
            delete state.lastOnline[action.payload.userID]
        },
    }
})


export const { addContactInfos, setLastOnlineStatuses, addLastOnlineStatus, 
    removeLastOnlineStatus, addLastOnlineStatuses } = contactsSlice.actions

export default contactsSlice.reducer