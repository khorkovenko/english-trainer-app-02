import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../app/supabaseClient';

export const fetchWritingPrompts = createAsyncThunk(
    'writing/fetchWritingPrompts',
    async (userId, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('writing_prompts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const addWritingPrompt = createAsyncThunk(
    'writing/addWritingPrompt',
    async ({ prompt, userId }, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('writing_prompts')
            .insert([{ prompt, user_id: userId, created_at: new Date(), updated_at: new Date() }])
            .select()
            .single();
        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

export const deleteWritingPrompt = createAsyncThunk(
    'writing/deleteWritingPrompt',
    async ({ promptId, userId }, thunkAPI) => {
        const { error } = await supabaseClient
            .from('writing_prompts')
            .delete()
            .eq('id', promptId)
            .eq('user_id', userId);
        if (error) return thunkAPI.rejectWithValue(error.message);
        return promptId;
    }
);

const writingSlice = createSlice({
    name: 'writing',
    initialState: {
        prompts: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWritingPrompts.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWritingPrompts.fulfilled, (state, action) => {
                state.prompts = action.payload;
                state.loading = false;
            })
            .addCase(addWritingPrompt.fulfilled, (state, action) => {
                state.prompts.push(action.payload);
            })
            .addCase(deleteWritingPrompt.fulfilled, (state, action) => {
                state.prompts = state.prompts.filter((p) => p.id !== action.payload);
            })
            .addMatcher(
                (action) => action.type.startsWith('writing/') && action.type.endsWith('/rejected'),
                (state, action) => {
                    state.error = action.payload;
                    state.loading = false;
                }
            );
    },
});

export default writingSlice.reducer;
