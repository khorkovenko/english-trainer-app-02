import { configureStore } from '@reduxjs/toolkit'
import vocabReducer from '../features/01vocabulary/vocabSlice'
import authSlice from "../features/loginModal/authSlice";
import grammarReducer from '../features/02grammar/grammarSlice';
import readingReducer from '../features/03reading/readingSlice';
import listeningSlice from '../features/04listening/listeningSlice';


export const store = configureStore({
    reducer: {
        vocab: vocabReducer,
        grammar: grammarReducer,
        reading: readingReducer,
        listening: listeningSlice,
        auth: authSlice
    },
})
