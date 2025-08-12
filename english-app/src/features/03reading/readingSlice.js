import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../app/supabaseClient';

export const fetchReadings = createAsyncThunk(
    'reading/fetchReadings',
    async (userId, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('reading')
            .select('*, reading_prompts(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const saveReading = createAsyncThunk(
    'reading/saveReading',
    async ({ userId, reading }, thunkAPI) => {
        if (reading.id) {
            const { error } = await supabaseClient
                .from('reading')
                .update({ theme: reading.theme, updated_at: new Date() })
                .eq('id', reading.id);
            if (error) return thunkAPI.rejectWithValue(error.message);
            return { id: reading.id, ...reading };
        } else {
            const { data, error } = await supabaseClient
                .from('reading')
                .insert([{ user_id: userId, theme: reading.theme, created_at: new Date(), updated_at: new Date() }])
                .select()
                .single();
            if (error) return thunkAPI.rejectWithValue(error.message);
            return data;
        }
    }
);

export const saveReadingPrompt = createAsyncThunk(
    'reading/saveReadingPrompt',
    async ({ readingId, prompt, userId }, thunkAPI) => {
        const { data, error } = await supabaseClient.from('reading_prompts').insert([
            { reading_id: readingId, prompt, created_at: new Date(), updated_at: new Date() }
        ])
            .select()
            .single();
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const deleteReadingPrompt = createAsyncThunk(
    'reading/deleteReadingPrompt',
    async ({ promptId, userId }, thunkAPI) => {
        const { error } = await supabaseClient.from('reading_prompts').delete().eq('id', promptId);
        if (error) return thunkAPI.rejectWithValue(error.message);
    }
);

export const deleteReading = createAsyncThunk(
    'reading/deleteReading',
    async ({ readingId, userId }, thunkAPI) => {
        const { error } = await supabaseClient.from('reading').delete().eq('id', readingId);
        if (error) return thunkAPI.rejectWithValue(error.message);
    }
);

const readingSlice = createSlice({
    name: 'reading',
    initialState: {
        readings: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchReadings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReadings.fulfilled, (state, action) => {
                state.readings = action.payload;
                state.loading = false;
            })
            .addCase(fetchReadings.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })
            .addMatcher(
                (action) => action.type.startsWith('reading/') && action.type.endsWith('/rejected'),
                (state, action) => {
                    state.error = action.payload;
                    state.loading = false;
                }
            );
    },
});

export default readingSlice.reducer;
