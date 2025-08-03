import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabaseClient } from '../../supabaseClient'

export const fetchAuthUser = createAsyncThunk('auth/fetchUser', async () => {
    const { data, error } = await supabaseClient.auth.getUser()
    if (error || !data?.user) throw error || new Error('No user found')
    return data.user
})

export const signOut = createAsyncThunk('auth/signOut', async () => {
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
    return null
})

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchAuthUser.pending, state => {
                state.status = 'loading'
            })
            .addCase(fetchAuthUser.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.user = action.payload
            })
            .addCase(fetchAuthUser.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.error.message
            })
            .addCase(signOut.fulfilled, state => {
                state.user = null
                state.status = 'idle'
            })
    },
})

export default authSlice.reducer
