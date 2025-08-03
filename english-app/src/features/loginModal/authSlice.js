// src/features/loginModal/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabaseClient } from '../../app/supabaseClient'

// Fetch current session and return user or null
export const fetchAuthUser = createAsyncThunk('auth/fetchUser', async () => {
    const { data, error } = await supabaseClient.auth.getSession()
    if (error) throw error
    return data?.session?.user ?? null
})

// Sign out user
export const signOut = createAsyncThunk('auth/signOut', async () => {
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
    return null
})

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        status: 'idle', // idle | loading | succeeded | failed
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchAuthUser.pending, state => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchAuthUser.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.user = action.payload
                state.error = null
            })
            .addCase(fetchAuthUser.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.error.message
                state.user = null
            })
            .addCase(signOut.fulfilled, state => {
                state.user = null
                state.status = 'idle'
                state.error = null
            })
    },
})

export default authSlice.reducer
