// state/selectors/conversations.ts
import type { RootState } from "../index"
import type { ConversationType } from "../ducks/conversations"

/** Grab the full array */
export const getConversations = (state: RootState): ConversationType[] =>
  state.conversations.items

/** (Optional) one by ID */
export const getConversationById = (
  state: RootState,
  id: string
): ConversationType | undefined =>
  state.conversations.items.find((c) => c.id === id)
