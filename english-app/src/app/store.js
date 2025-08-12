import { configureStore } from '@reduxjs/toolkit'
import vocabReducer from '../features/01vocabulary/vocabSlice'
import authSlice from "../features/loginModal/authSlice";
import grammarReducer from '../features/02grammar/grammarSlice';
import readingReducer from '../features/03reading/readingSlice';
import listeningSlice from '../features/04listening/listeningSlice';
import speakingSlice from '../features/05speaking/speakingSlice';
import writingSlice from '../features/06writing/writingSlice';


export const store = configureStore({
    reducer: {
        vocab: vocabReducer,
        grammar: grammarReducer,
        reading: readingReducer,
        listening: listeningSlice,
        speaking: speakingSlice,
        writing: writingSlice,
        auth: authSlice
    },
})
