import { configureStore } from '@reduxjs/toolkit'
import vocabReducer from '../features/01vocabulary/vocabSlice'
import authSlice from "../features/loginModal/authSlice";

export const store = configureStore({
    reducer: {
        vocab: vocabReducer,
        auth: authSlice
    },
})
