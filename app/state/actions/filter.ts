import { bindActionCreators } from "redux"
import {
  setEnabled,
  setGlobalEnabled,
  setSimilarityThreshold,
  setStats,
  resetStats,
  setConfiguring,
  setError,
} from "../ducks/filter"

export const actions = {
  setFilterEnabled: setEnabled,
  setGlobalFilterEnabled: setGlobalEnabled,
  setFilterSimilarityThreshold: setSimilarityThreshold,
  setFilterStats: setStats,
  resetFilterStats: resetStats,
  setFilterConfiguring: setConfiguring,
  setFilterError: setError,
}

export const mapDispatchToProps = (dispatch: any) => ({
  filterActions: bindActionCreators(actions, dispatch),
})
