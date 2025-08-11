import { configureStore } from '@reduxjs/toolkit'
import vocabReducer from '../features/01vocabulary/vocabSlice'
import authSlice from "../features/loginModal/authSlice";
import grammarReducer from '../features/02grammar/grammarSlice';
import readingReducer from '../features/03reading/readingSlice';


export const store = configureStore({
    reducer: {
        vocab: vocabReducer,
        grammar: grammarReducer,
        reading: readingReducer,
        auth: authSlice
    },
})
