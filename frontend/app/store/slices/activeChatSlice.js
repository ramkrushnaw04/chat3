// stores all the other users in the application

import { createSlice } from '@reduxjs/toolkit'

const initialState = {

}

export const activeChatSlice = createSlice({
    name: 'activeChat',
    initialState,
    reducers: {
        setActiveChatInfo: (state, action) => {
            // console.log(action.payload)
            return {...action.payload}
        }
    }
})


export const { setActiveChatInfo } = activeChatSlice.actions

export default activeChatSlice.reducer