import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../app/supabaseClient';

// Get the currently authenticated user
export const fetchAuthUser = createAsyncThunk(
    'vocab/fetchAuthUser',
    async (_, thunkAPI) => {
        try {
            const { data, error } = await supabaseClient.auth.getUser();
            if (error) return thunkAPI.rejectWithValue(error.message);
            if (!data?.user) return thunkAPI.rejectWithValue('No user logged in');
            return data.user;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// Get words for that user
export const fetchWordsByUserId = createAsyncThunk(
    'vocab/fetchWords',
    async (userId, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

// Insert or update word
export const saveWord = createAsyncThunk(
    'vocab/saveWord',
    async ({ userId, wordObj }, thunkAPI) => {
        try {
            if (wordObj.id) {
                // update
                const { error } = await supabaseClient
                    .from('words')
                    .update({
                        word: wordObj.word,
                        explanation: wordObj.explanation,
                        association: wordObj.association,
                        updated_at: new Date(),
                    })
                    .eq('id', wordObj.id);
                if (error) return thunkAPI.rejectWithValue(error.message);
            } else {
                // insert
                const insertObj = {
                    word: wordObj.word,
                    explanation: wordObj.explanation,
                    association: wordObj.association,
                    user_id: userId,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                const { error } = await supabaseClient
                    .from('words')
                    .insert([insertObj]);
                if (error) return thunkAPI.rejectWithValue(error.message);
            }

            return thunkAPI.dispatch(fetchWordsByUserId(userId));
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// Delete a word
export const deleteWordById = createAsyncThunk(
    'vocab/deleteWord',
    async ({ userId, wordId }, thunkAPI) => {
        const { error } = await supabaseClient
            .from('words')
            .delete()
            .eq('id', wordId);

        if (error) return thunkAPI.rejectWithValue(error.message);

        return thunkAPI.dispatch(fetchWordsByUserId(userId));
    }
);

const vocabSlice = createSlice({
    name: 'vocab',
    initialState: {
        user: null,
        words: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchAuthUser.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAuthUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.loading = false;
            })
            .addCase(fetchAuthUser.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(fetchWordsByUserId.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWordsByUserId.fulfilled, (state, action) => {
                state.words = action.payload;
                state.loading = false;
            })
            .addCase(fetchWordsByUserId.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(saveWord.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveWord.fulfilled, state => {
                state.loading = false;
            })
            .addCase(saveWord.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(deleteWordById.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteWordById.fulfilled, state => {
                state.loading = false;
            })
            .addCase(deleteWordById.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(deleteAllWords.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAllWords.fulfilled, state => {
                state.loading = false;
            })
            .addCase(deleteAllWords.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

    },
});

// Delete all words
export const deleteAllWords = createAsyncThunk(
    'vocab/deleteAllWords',
    async (userId, thunkAPI) => {
        const { error } = await supabaseClient
            .from('words')
            .delete()
            .eq('user_id', userId);

        if (error) return thunkAPI.rejectWithValue(error.message);

        return thunkAPI.dispatch(fetchWordsByUserId(userId));
    }
);

export default vocabSlice.reducer;
