import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {supabaseClient} from '../../supabaseClient';

const USER_EMAIL = "horkovenko.k@gmail.com";

export const fetchUserByEmail = createAsyncThunk(
    'vocab/fetchUser',
    async (email, thunkAPI) => {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            console.log('Fetching user by email:', normalizedEmail);

            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .ilike('email', normalizedEmail)  // case-insensitive match
                .maybeSingle();

            if (error) return thunkAPI.rejectWithValue(error.message);
            if (!data) return thunkAPI.rejectWithValue('No user found with this email.');

            return data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// Async thunk: fetch vocab words by user_id
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

// Async thunk: add or update a word
export const saveWord = createAsyncThunk(
    'vocab/saveWord',
    async ({ userId, wordObj }, thunkAPI) => {
        if (wordObj.id) {
            // update
            const { error } = await supabaseClient
                .from('words')
                .update({
                    word: wordObj.word,
                    explanation: wordObj.explanation,
                    association: wordObj.association,
                    updated_at: new Date()
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
    }
);

// Async thunk: delete word by id
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

// Async thunk: flush all data (delete all words and user by email)
export const flushAllData = createAsyncThunk(
    'vocab/flushAll',
    async (_, thunkAPI) => {
        // 1. Find user by email
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('id')
            .eq('email', USER_EMAIL)
            .limit(1)
            .single();

        if (userError) return thunkAPI.rejectWithValue(userError.message);
        if (!user) return thunkAPI.rejectWithValue('User not found');

        // 2. Delete all words for that user
        const { error: delWordsError } = await supabaseClient
            .from('words')
            .delete()
            .eq('user_id', user.id);

        if (delWordsError) return thunkAPI.rejectWithValue(delWordsError.message);

        // 3. Delete user record
        const { error: delUserError } = await supabaseClient
            .from('users')
            .delete()
            .eq('email', USER_EMAIL);

        if (delUserError) return thunkAPI.rejectWithValue(delUserError.message);

        return true;
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
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserByEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserByEmail.fulfilled, (state, action) => {
                state.user = action.payload;
                state.loading = false;
            })
            .addCase(fetchUserByEmail.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(fetchWordsByUserId.pending, (state) => {
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

            .addCase(saveWord.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveWord.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(saveWord.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(deleteWordById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteWordById.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deleteWordById.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(flushAllData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(flushAllData.fulfilled, (state) => {
                state.user = null;
                state.words = [];
                state.loading = false;
            })
            .addCase(flushAllData.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            });
    }
});

export default vocabSlice.reducer;
