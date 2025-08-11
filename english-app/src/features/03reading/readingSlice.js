// src/features/reading/readingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../app/supabaseClient';

// Fetch reading themes by user
export const fetchReadingItems = createAsyncThunk(
    'reading/fetchItems',
    async (userId, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('reading')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

// Save or update a reading theme
export const saveReadingItem = createAsyncThunk(
    'reading/saveItem',
    async ({ userId, item }, thunkAPI) => {
        try {
            if (item.id) {
                const { error } = await supabaseClient
                    .from('reading')
                    .update({
                        theme: item.theme,
                        prompt: item.prompt,
                        updated_at: new Date()
                    })
                    .eq('id', item.id);
                if (error) return thunkAPI.rejectWithValue(error.message);
            } else {
                const { error } = await supabaseClient
                    .from('reading')
                    .insert([{
                        user_id: userId,
                        theme: item.theme,
                        prompt: item.prompt,
                        created_at: new Date(),
                        updated_at: new Date()
                    }]);
                if (error) return thunkAPI.rejectWithValue(error.message);
            }
            return thunkAPI.dispatch(fetchReadingItems(userId));
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// Delete reading theme
export const deleteReadingItem = createAsyncThunk(
    'reading/deleteItem',
    async ({ userId, itemId }, thunkAPI) => {
        const { error } = await supabaseClient
            .from('reading')
            .delete()
            .eq('id', itemId);

        if (error) return thunkAPI.rejectWithValue(error.message);
        return thunkAPI.dispatch(fetchReadingItems(userId));
    }
);

const readingSlice = createSlice({
    name: 'reading',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchReadingItems.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReadingItems.fulfilled, (state, action) => {
                state.items = action.payload;
                state.loading = false;
            })
            .addCase(fetchReadingItems.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(saveReadingItem.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveReadingItem.fulfilled, state => {
                state.loading = false;
            })
            .addCase(saveReadingItem.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(deleteReadingItem.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteReadingItem.fulfilled, state => {
                state.loading = false;
            })
            .addCase(deleteReadingItem.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            });
    }
});

export default readingSlice.reducer;
