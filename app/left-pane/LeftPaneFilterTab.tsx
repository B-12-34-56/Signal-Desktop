import { connect } from "react-redux"
import type { StateType } from "../state/reducer"
import { getFilter } from "../state/selectors/filter"
import { mapDispatchToProps } from "../state/actions/filter"
import { FilterTab } from "../filter/FilterTab"
import type { LocalizerType } from "../types/Util"

type SmartFilterTabProps = {
  i18n: LocalizerType
}

const mapStateToProps = (state: StateType) => {
  return {
    filter: getFilter(state),
  }
}

const smart = connect(mapStateToProps, mapDispatchToProps)

export const SmartFilterTab = smart(
  ({
    filter,
    filterActions,
    i18n,
  }: SmartFilterTabProps & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>) => {
    return <FilterTab i18n={i18n} />
  },
)
