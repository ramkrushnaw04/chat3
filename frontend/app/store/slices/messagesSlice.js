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
        addNewPendingMessage: (state, action) => {
            const {chatID, message} = action.payload

            if(!state.pendingMessages[chatID]) {
                state.pendingMessages[chatID] = [message]
            }
            else {
                state.pendingMessages[chatID] = [...state.pendingMessages[chatID], message]
            }
        },
        resetPendingMessages: (state, action) => {
            const {chatID} = action.payload
            state.pendingMessages[chatID] = []
        }
    }
})


export const { setMessages, addNewMessage, addNewPendingMessage, resetPendingMessages } = messagesSlice.actions

export default messagesSlice.reducer