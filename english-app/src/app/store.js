import { configureStore } from '@reduxjs/toolkit'
import vocabReducer from '../features/01vocabulary/vocabSlice'

export const store = configureStore({
    reducer: {
        vocab: vocabReducer,
    },
})
