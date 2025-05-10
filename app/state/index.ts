// app/state/index.ts
import { configureStore } from "@reduxjs/toolkit"
import conversationsReducer from "./ducks/conversations"

export const store = configureStore({
  reducer: {
    conversations: conversationsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
