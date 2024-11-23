import { createSlice } from '@reduxjs/toolkit'
import { actionAsyncStorage } from 'next/dist/client/components/action-async-storage-instance'

const initialState = {
    pendingMessages: {

    },
    lastMessages: {

    },
    replyingTo: null 
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
        setPendingMessages: (state, action) => {
            // console.log('setPendingMessages', action.payload)
            const {chatID, messages} = action.payload
            state.pendingMessages[chatID] = messages
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
        setReplyingToMessage: (state, action) => {
            state.replyingTo = action.payload
        }
    }
})


export const { setMessages, addNewMessage, addNewPendingMessage, 
    resetPendingMessages, addMultipleNewMessage, setMessagesInBatch, 
    setPendingMessages, setReplyingToMessage } = messagesSlice.actions

export default messagesSlice.reducer