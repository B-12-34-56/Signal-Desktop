import { createSelector } from "reselect"
import type { StateType } from "../reducer"

export const getFilter = (state: StateType) => state.filter

export const getFilterEnabled = createSelector(getFilter, (filter) => filter.isEnabled)

export const getGlobalFilterEnabled = createSelector(getFilter, (filter) => filter.isGlobalEnabled)

export const getSimilarityThreshold = createSelector(getFilter, (filter) => filter.similarityThreshold)

export const getFilterStats = createSelector(getFilter, (filter) => filter.stats)

export const getIsConfiguring = createSelector(getFilter, (filter) => filter.isConfiguring)

export const getFilterError = createSelector(getFilter, (filter) => filter.error)
