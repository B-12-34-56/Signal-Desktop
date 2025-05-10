// app/state/actions/conversations.ts

import type { Dispatch } from "redux"
import type { ConversationType } from "../ducks/conversations"
import {
  setConversations,
  addConversation,
  removeConversation
} from "../ducks/conversations"

/**
 * Re-export the slice action creators from Redux Toolkit
 */
export { setConversations, addConversation, removeConversation }

/**
 * Async thunk to fetch conversations from an API endpoint
 */
export const fetchConversations = () => async (dispatch: Dispatch) => {
  try {
    const response = await fetch("/api/conversations")
    const data: ConversationType[] = await response.json()
    dispatch(setConversations(data))
  } catch (error) {
    console.error("fetchConversations failed", error)
  }
}
