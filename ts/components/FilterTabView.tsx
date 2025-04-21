// ts/components/FilterTabView.tsx

import React from 'react';
import type { FilterTabSelectedView } from './FilterTab';
import type {
  CallHistoryFilterOptions,
  CallHistoryGroup,
  CallHistoryPagination,
} from '../types/CallDisposition';
import type { ActiveCallStateType } from '../state/ducks/calling';

export interface FilterTabViewProps {
  activeCall: ActiveCallStateType | undefined;
  getCallHistoryGroupsCount: (
    opts: CallHistoryFilterOptions
  ) => Promise<number>;
  getCallHistoryGroups: (
    opts: CallHistoryFilterOptions,
    pg: CallHistoryPagination
  ) => Promise<CallHistoryGroup[]>;
  callHistoryEdition: number;
  getAdhocCall: (roomId: string) => any;
  getCall: (id: string) => any;
  getCallLink: (id: string) => any;
  getConversation: (id: string) => any;
  hangUpActiveCall: (reason: string) => void;
  i18n: (key: string) => string;
  selectedCallHistoryGroup: CallHistoryGroup | null;
  onChangeFilterTabSelectedView: (
    view: FilterTabSelectedView | null
  ) => void;
  onCreateCallLink: () => void;
  onOutgoingAudioCallInConversation: (cid: string) => void;
  onOutgoingVideoCallInConversation: (cid: string) => void;
  peekNotConnectedGroupCall: (opts: any) => void;
  startCallLinkLobbyByRoomId: (opts: { roomId: string }) => void;
  toggleConfirmLeaveCallModal: (opts: any) => void;
  togglePip: () => void;
}

export const FilterTabView: React.FC<FilterTabViewProps> = (props) => {
  const { i18n } = props;

  return (
    <div className="FilterTabView">
      <h2>{i18n('icu:FilterTab__HeaderTitle')}</h2>
      <p>Call history will be rendered here.</p>
      {/* TODO: implement list, pagination, and interactions using the other props */}
    </div>
  );
};
