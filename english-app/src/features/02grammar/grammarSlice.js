import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../app/supabaseClient';

// Fetch grammar rules by user ID
export const fetchGrammarRules = createAsyncThunk(
    'grammar/fetchRules',
    async (userId, thunkAPI) => {
        const { data, error } = await supabaseClient
            .from('grammar')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return thunkAPI.rejectWithValue(error.message);
        return data;
    }
);

// Save or update grammar rule
export const saveGrammarRule = createAsyncThunk(
    'grammar/saveRule',
    async ({ userId, rule }, thunkAPI) => {
        try {
            if (rule.id) {
                const { error } = await supabaseClient
                    .from('grammar')
                    .update({
                        rule_name: rule.rule_name,
                        html_explanation: rule.html_explanation,
                        updated_at: new Date()
                    })
                    .eq('id', rule.id);
                if (error) return thunkAPI.rejectWithValue(error.message);
            } else {
                const { error } = await supabaseClient
                    .from('grammar')
                    .insert([
                        {
                            user_id: userId,
                            rule_name: rule.rule_name,
                            html_explanation: rule.html_explanation,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                    ]);
                if (error) return thunkAPI.rejectWithValue(error.message);
            }

            return thunkAPI.dispatch(fetchGrammarRules(userId));
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// Delete grammar rule
export const deleteGrammarRule = createAsyncThunk(
    'grammar/deleteRule',
    async ({ userId, ruleId }, thunkAPI) => {
        const { error } = await supabaseClient
            .from('grammar')
            .delete()
            .eq('id', ruleId);

        if (error) return thunkAPI.rejectWithValue(error.message);
        return thunkAPI.dispatch(fetchGrammarRules(userId));
    }
);

const grammarSlice = createSlice({
    name: 'grammar',
    initialState: {
        rules: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchGrammarRules.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGrammarRules.fulfilled, (state, action) => {
                state.rules = action.payload;
                state.loading = false;
            })
            .addCase(fetchGrammarRules.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(saveGrammarRule.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveGrammarRule.fulfilled, state => {
                state.loading = false;
            })
            .addCase(saveGrammarRule.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(deleteGrammarRule.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteGrammarRule.fulfilled, state => {
                state.loading = false;
            })
            .addCase(deleteGrammarRule.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            });
    }
});

export default grammarSlice.reducer;
