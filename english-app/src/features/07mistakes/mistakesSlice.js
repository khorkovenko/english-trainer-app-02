import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabaseClient } from '../../app/supabaseClient'

const mistakeTypes = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
    'speaking',
    'writing'
]
const maxMistakes = 30

// Fetch mistakes for current auth user
export const fetchMistakes = createAsyncThunk(
    'mistakes/fetchMistakes',
    async (_, { rejectWithValue }) => {
        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession()
        if (sessionError) return rejectWithValue(sessionError.message)

        const user = session?.user
        if (!user) return rejectWithValue('No authenticated user')

        // Try to get the existing row for this user
        const { data, error } = await supabaseClient
            .from('mistakes')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

        if (error) return rejectWithValue(error.message)

        // If no row exists yet, insert an empty one
        if (!data) {
            const emptyRow = {
                user_id: user.id,
                vocabulary: [],
                grammar: [],
                reading: [],
                listening: [],
                speaking: [],
                writing: []
            }
            const { error: insertError } = await supabaseClient
                .from('mistakes')
                .insert([emptyRow])

            if (insertError) return rejectWithValue(insertError.message)
            return emptyRow
        }

        // Map and limit mistakes
        const mistakesMap = {}
        mistakeTypes.forEach(type => {
            mistakesMap[type] = Array.isArray(data?.[type])
                ? data[type].slice(0, maxMistakes)
                : []
        })

        return mistakesMap
    }
)

// Save mistakes for current auth user
export const saveMistakes = createAsyncThunk(
    'mistakes/saveMistakes',
    async (mistakesMap, { rejectWithValue }) => {
        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession()
        if (sessionError) return rejectWithValue(sessionError.message)

        const user = session?.user
        if (!user) return rejectWithValue('No authenticated user')

        const { error } = await supabaseClient
            .from('mistakes')
            .upsert([{ user_id: user.id, ...mistakesMap }], {
                onConflict: 'user_id'
            })

        if (error) return rejectWithValue(error.message)
        return mistakesMap
    }
)

const mistakesSlice = createSlice({
    name: 'mistakes',
    initialState: {
        data: {
            vocabulary: [],
            grammar: [],
            reading: [],
            listening: [],
            speaking: [],
            writing: []
        },
        status: 'idle',
        error: null
    },
    reducers: {
        addMistake: (state, action) => {
            const { type, value } = action.payload
            if (!state.data[type]) return
            state.data[type].unshift(value)
            if (state.data[type].length > maxMistakes) {
                state.data[type].pop()
            }
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchMistakes.pending, state => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchMistakes.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.data = action.payload
            })
            .addCase(fetchMistakes.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.payload || action.error.message
            })
            .addCase(saveMistakes.fulfilled, (state, action) => {
                state.data = action.payload
            })
    }
})

export const { addMistake } = mistakesSlice.actions
export default mistakesSlice.reducer
