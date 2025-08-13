// features/mistakes/mistakesSlice.js
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

// Fetch mistakes from Supabase
export const fetchMistakes = createAsyncThunk(
    'mistakes/fetchMistakes',
    async () => {
        const { data, error } = await supabaseClient
            .from('mistakes')
            .select('*')
            .single()

        if (error) throw error

        const mistakesMap = {}
        mistakeTypes.forEach(type => {
            mistakesMap[type] = Array.isArray(data?.[type])
                ? data[type].slice(0, maxMistakes)
                : []
        })
        return mistakesMap
    }
)

// Save mistakes to Supabase
export const saveMistakes = createAsyncThunk(
    'mistakes/saveMistakes',
    async (mistakesMap) => {
        const { error } = await supabaseClient
            .from('mistakes')
            .upsert([mistakesMap], { onConflict: 'id' })

        if (error) throw error
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
                state.error = action.error.message
            })
            .addCase(saveMistakes.fulfilled, (state, action) => {
                state.data = action.payload
            })
    }
})

export const { addMistake } = mistakesSlice.actions
export default mistakesSlice.reducer
