import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface FilterState {
  isEnabled: boolean
  isGlobalEnabled: boolean
  similarityThreshold: number
  stats: {
    imagesBlocked: number
    textsBlocked: number
    videosBlocked: number
  }
  isConfiguring: boolean
  error: string | null
}

const initialState: FilterState = {
  isEnabled: true,
  isGlobalEnabled: true,
  similarityThreshold: 90,
  stats: {
    imagesBlocked: 0,
    textsBlocked: 0,
    videosBlocked: 0,
  },
  isConfiguring: false,
  error: null,
}

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setEnabled(state, action: PayloadAction<boolean>) {
      state.isEnabled = action.payload
    },
    setGlobalEnabled(state, action: PayloadAction<boolean>) {
      state.isGlobalEnabled = action.payload
    },
    setSimilarityThreshold(state, action: PayloadAction<number>) {
      state.similarityThreshold = action.payload
    },
    setStats(state, action: PayloadAction<FilterState["stats"]>) {
      state.stats = action.payload
    },
    incrementStat(
      state,
      action: PayloadAction<{ type: "imagesBlocked" | "textsBlocked" | "videosBlocked"; count: number }>,
    ) {
      const { type, count } = action.payload
      state.stats[type] += count
    },
    resetStats(state) {
      state.stats = {
        imagesBlocked: 0,
        textsBlocked: 0,
        videosBlocked: 0,
      }
    },
    setConfiguring(state, action: PayloadAction<boolean>) {
      state.isConfiguring = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const {
  setEnabled,
  setGlobalEnabled,
  setSimilarityThreshold,
  setStats,
  incrementStat,
  resetStats,
  setConfiguring,
  setError,
} = filterSlice.actions

export default filterSlice.reducer
