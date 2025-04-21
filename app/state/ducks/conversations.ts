// app/state/ducks/conversations.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

/** A single conversation */
export interface ConversationType {
  id: string
  participants: string[]
  lastMessage: string
  timestamp: number

  // fields your FilterTab expects:
  filterExcluded?: boolean
  title?: string
  name?: string
  phoneNumber?: string
}

/** The shape of our conversations slice in the store */
export interface ConversationsState {
  items: ConversationType[]
  loading: boolean
  error?: string
}

const initialState: ConversationsState = {
  items: [],
  loading: false,
}

const slice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<ConversationType[]>) {
      state.items = action.payload
      state.loading = false
      state.error = undefined
    },
    addConversation(state, action: PayloadAction<ConversationType>) {
      state.items.push(action.payload)
    },
    removeConversation(state, action: PayloadAction<string>) {
      state.items = state.items.filter(c => c.id !== action.payload)
    },
  },
})

export const {
  setConversations,
  addConversation,
  removeConversation,
} = slice.actions

export default slice.reducer
