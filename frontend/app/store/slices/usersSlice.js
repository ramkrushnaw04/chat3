// stores all the other users in the application

import { createSlice } from '@reduxjs/toolkit'

const initialState = {

}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        addUserInfo: (state, action) => {
            state[action.payload._id] = action.payload
        },
    }
})


export const { addUserInfo } = userSlice.actions

export default userSlice.reducer