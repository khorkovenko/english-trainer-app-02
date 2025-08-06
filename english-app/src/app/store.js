import { configureStore } from '@reduxjs/toolkit'
import vocabReducer from '../features/01vocabulary/vocabSlice'
import authSlice from "../features/loginModal/authSlice";
import grammarReducer from '../features/02grammar/grammarSlice';

export const store = configureStore({
    reducer: {
        vocab: vocabReducer,
        grammar: grammarReducer,
        auth: authSlice
    },
})
