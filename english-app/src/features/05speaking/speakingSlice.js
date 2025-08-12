import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../app/supabaseClient';

export const fetchSpeaking = createAsyncThunk(
    'speaking/fetchSpeaking',
    async (userId, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('speaking')
            .select('*, speaking_prompts(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const saveSpeaking = createAsyncThunk(
    'speaking/saveSpeaking',
    async ({ userId, speaking }, thunkAPI) => {
        if (speaking.id) {
            const { error } = await supabaseClient
                .from('speaking')
                .update({ topic: speaking.topic, updated_at: new Date() })
                .eq('id', speaking.id);
            if (error) return thunkAPI.rejectWithValue(error.message);
            return { id: speaking.id, ...speaking };
        } else {
            const { data, error } = await supabaseClient
                .from('speaking')
                .insert([{ user_id: userId, topic: speaking.topic, created_at: new Date(), updated_at: new Date() }])
                .select()
                .single();
            if (error) return thunkAPI.rejectWithValue(error.message);
            return data;
        }
    }
);

export const saveSpeakingPrompt = createAsyncThunk(
    'speaking/saveSpeakingPrompt',
    async ({ speakingId, prompt, userId }, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('speaking_prompts')
            .insert([{ speaking_id: speakingId, prompt, created_at: new Date(), updated_at: new Date() }])
            .select()
            .single();
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const deleteSpeakingPrompt = createAsyncThunk(
    'speaking/deleteSpeakingPrompt',
    async ({ promptId, userId }, thunkAPI) => {
        const { error } = await supabaseClient.from('speaking_prompts').delete().eq('id', promptId);
        if (error) return thunkAPI.rejectWithValue(error.message);
    }
);

export const deleteSpeaking = createAsyncThunk(
    'speaking/deleteSpeaking',
    async ({ speakingId, userId }, thunkAPI) => {
        const { error } = await supabaseClient.from('speaking').delete().eq('id', speakingId);
        if (error) return thunkAPI.rejectWithValue(error.message);
    }
);

const speakingSlice = createSlice({
    name: 'speaking',
    initialState: {
        speaking: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSpeaking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSpeaking.fulfilled, (state, action) => {
                state.speaking = action.payload;
                state.loading = false;
            })
            .addCase(fetchSpeaking.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })
            .addMatcher(
                (action) => action.type.startsWith('speaking/') && action.type.endsWith('/rejected'),
                (state, action) => {
                    state.error = action.payload;
                    state.loading = false;
                }
            );
    },
});

export default speakingSlice.reducer;
