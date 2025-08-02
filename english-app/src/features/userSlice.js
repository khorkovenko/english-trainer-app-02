import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabaseClient } from '../supabaseClient'

export const fetchUser = createAsyncThunk('user/fetchUser', async () => {
    const { data, error } = await supabaseClient.from('users').select('*').limit(1).single()
    if (error) throw error
    return data
})

const userSlice = createSlice({
    name: 'user',
    initialState: {
        user: null,
        status: 'idle',
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchUser.pending, state => {
                state.status = 'loading'
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.user = action.payload
            })
            .addCase(fetchUser.rejected, state => {
                state.status = 'failed'
            })
    },
})

export default userSlice.reducer
