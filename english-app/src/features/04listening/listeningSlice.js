import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../app/supabaseClient';

export const fetchListenings = createAsyncThunk(
    'listening/fetchListenings',
    async (userId, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('listening')
            .select('*, listening_prompts(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const saveListening = createAsyncThunk(
    'listening/saveListening',
    async ({ userId, listening }, thunkAPI) => {
        if (listening.id) {
            const { error } = await supabaseClient
                .from('listening')
                .update({ theme: listening.theme, updated_at: new Date() })
                .eq('id', listening.id);
            if (error) return thunkAPI.rejectWithValue(error.message);
            return { id: listening.id, ...listening };
        } else {
            const { data, error } = await supabaseClient
                .from('listening')
                .insert([{ user_id: userId, theme: listening.theme, created_at: new Date(), updated_at: new Date() }])
                .select()
                .single();
            if (error) return thunkAPI.rejectWithValue(error.message);
            return data;
        }
    }
);

export const saveListeningPrompt = createAsyncThunk(
    'listening/saveListeningPrompt',
    async ({ listeningId, prompt, userId }, thunkAPI) => {
        const { data, error } = await supabaseClient.from('listening_prompts').insert([
            { listening_id: listeningId, prompt, created_at: new Date(), updated_at: new Date() }
        ])
            .select()
            .single();
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const deleteListeningPrompt = createAsyncThunk(
    'listening/deleteListeningPrompt',
    async ({ promptId, userId }, thunkAPI) => {
        const { error } = await supabaseClient.from('listening_prompts').delete().eq('id', promptId);
        if (error) return thunkAPI.rejectWithValue(error.message);
    }
);

export const deleteListening = createAsyncThunk(
    'listening/deleteListening',
    async ({ listeningId, userId }, thunkAPI) => {
        const { error } = await supabaseClient.from('listening').delete().eq('id', listeningId);
        if (error) return thunkAPI.rejectWithValue(error.message);
    }
);

const listeningSlice = createSlice({
    name: 'listening',
    initialState: {
        listenings: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchListenings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchListenings.fulfilled, (state, action) => {
                state.listenings = action.payload;
                state.loading = false;
            })
            .addCase(fetchListenings.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })
            .addMatcher(
                (action) => action.type.startsWith('listening/') && action.type.endsWith('/rejected'),
                (state, action) => {
                    state.error = action.payload;
                    state.loading = false;
                }
            );
    },
});

export default listeningSlice.reducer;
