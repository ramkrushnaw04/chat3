import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    pendingMessages: {

    },
    lastMessages: {

    }
}

export const messagesSlice = createSlice({
    name: 'messages',
    initialState,

    reducers: {
        setMessages: (state, action) => {
            const {chatID, messages} = action.payload
            state[chatID] = messages
        },
        addNewMessage: (state, action) => {
            const {chatID, message} = action.payload

            if(!state[chatID]) {
                state[chatID] = [message]
            }
            else {
                state[chatID] = [...state[chatID], message]
            }
        },
        
    }
})


export const { setMessages, addNewMessage } = messagesSlice.actions

export default messagesSlice.reducer