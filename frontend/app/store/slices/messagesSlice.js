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
        setMessagesInBatch: (state, action) => {
            // action.payload format: [{ chatID: updatedMessages }]
            console.log(action.payload)
            const keys = Object.keys(action.payload)
            for (const chatID of keys) {
                state[chatID]  = action.payload[chatID]
            }
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
        },
        addMultipleNewMessage: (state, action) => {
            const {chatID, messages} = action.payload

            if(!state[chatID]) {
                state[chatID] = messages
            }
            else {
                state[chatID] = [...state[chatID], ...messages]
            }
        },
    }
})


export const { setMessages, addNewMessage, addNewPendingMessage, resetPendingMessages, addMultipleNewMessage, setMessagesInBatch } = messagesSlice.actions

export default messagesSlice.reducer