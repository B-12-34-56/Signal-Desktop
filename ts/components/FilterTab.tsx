// Copyright 2023 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useCallback, useEffect, useState } from 'react'
import type { LocalizerType } from '../types/I18N'
import { NavSidebar, NavSidebarActionButton } from './NavSidebar'
import type { ConversationType } from '../state/ducks/conversations'
import type {
  CallHistoryFilterOptions,
  CallHistoryGroup,
  CallHistoryPagination,
} from '../types/CallDisposition'
import { CallsNewCall } from './CallsNewCallButton'
import { useEscapeHandling } from '../hooks/useEscapeHandling'
import type {
  ActiveCallStateType,
  PeekNotConnectedGroupCallType,
} from '../state/ducks/calling';
import { ContextMenu } from './ContextMenu';
import { ConfirmationDialog } from './ConfirmationDialog';
import type { UnreadStats } from '../util/countUnreadStats';
import type { WidthBreakpoint } from './_util';
import type { CallLinkType } from '../types/CallLink';
import type { CallStateType } from '../state/selectors/calling';
import type { StartCallData } from './ConfirmLeaveCallModal';

// Make sure this path matches your project structure:
import { FilterTabView } from './FilterTabView';

enum FilterTabSidebarView {
  View,
  NewCallView,
}

type FilterTabProps = Readonly<{
  activeCall: ActiveCallStateType | undefined;
  allConversations: ReadonlyArray<ConversationType>;
  otherTabsUnreadStats: UnreadStats;
  getCallHistoryGroupsCount: (options: CallHistoryFilterOptions) => Promise<number>;
  getCallHistoryGroups: (
    options: CallHistoryFilterOptions,
    pagination: CallHistoryPagination
  ) => Promise<CallHistoryGroup[]>;
  callHistoryEdition: number;
  getAdhocCall: (roomId: string) => CallStateType | undefined;
  getCall: (id: string) => CallStateType | undefined;
  getCallLink: (id: string) => CallLinkType | undefined;
  getConversation: (id: string) => ConversationType | void;
  hangUpActiveCall: (reason: string) => void;
  hasAnyAdminCallLinks: boolean;
  hasFailedStorySends: boolean;
  hasPendingUpdate: boolean;
  i18n: LocalizerType;
  navTabsCollapsed: boolean;
  onClearCallHistory: () => void;
  onMarkCallHistoryRead: (conversationId: string, callId: string) => void;
  onToggleNavTabsCollapse: (collapsed: boolean) => void;
  onCreateCallLink: () => void;
  onOutgoingAudioCallInConversation: (conversationId: string) => void;
  onOutgoingVideoCallInConversation: (conversationId: string) => void;
  peekNotConnectedGroupCall: (
    options: PeekNotConnectedGroupCallType
  ) => void;
  preferredLeftPaneWidth: number;
  renderCallLinkDetails: (
    roomId: string,
    group: CallHistoryGroup,
    onClose: () => void
  ) => JSX.Element;
  renderConversationDetails: (
    conversationId: string,
    group: CallHistoryGroup | null
  ) => JSX.Element;
  renderToastManager: (opts: {
    containerWidthBreakpoint: WidthBreakpoint;
  }) => JSX.Element;
  regionCode: string | undefined;
  savePreferredLeftPaneWidth: (width: number) => void;
  startCallLinkLobbyByRoomId: (opts: { roomId: string }) => void;
  toggleConfirmLeaveCallModal: (opts: StartCallData | null) => void;
  togglePip: () => void;
}>;


const t: (key: string) => string = (key) =>
  // we ignore params & options here:
  i18n(key as any /* cast past ICU type-check */, undefined);

export type FilterTabSelectedView =
  | { type: 'conversation'; conversationId: string; callHistoryGroup: CallHistoryGroup | null }
  | { type: 'callLink'; roomId: string; callHistoryGroup: CallHistoryGroup };

export function FilterTab({
  activeCall,
  allConversations,
  otherTabsUnreadStats,
  getCallHistoryGroupsCount,
  getCallHistoryGroups,
  callHistoryEdition,
  getAdhocCall,
  getCall,
  getCallLink,
  getConversation,
  hangUpActiveCall,
  hasAnyAdminCallLinks,
  hasFailedStorySends,
  hasPendingUpdate,
  i18n,
  navTabsCollapsed,
  onClearCallHistory,
  onMarkCallHistoryRead,
  onToggleNavTabsCollapse,
  onCreateCallLink,
  onOutgoingAudioCallInConversation,
  onOutgoingVideoCallInConversation,
  peekNotConnectedGroupCall,
  preferredLeftPaneWidth,
  renderCallLinkDetails,
  renderConversationDetails,
  renderToastManager,
  regionCode,
  savePreferredLeftPaneWidth,
  startCallLinkLobbyByRoomId,
  toggleConfirmLeaveCallModal,
  togglePip,
}: FilterTabProps): JSX.Element {
  const [sidebarView, setSidebarView] = useState(FilterTabSidebarView.View);
  const [selectedView, setSelectedViewInner] = useState<FilterTabSelectedView | null>(null);
  const [selectedViewKey, setSelectedViewKey] = useState(() => 1);
  const [confirmClearCallHistoryDialogOpen, setConfirmClearCallHistoryDialogOpen] = useState(false);

  const updateSelectedView = useCallback(
    (next: FilterTabSelectedView | null) => {
      setSelectedViewInner(next);
      setSelectedViewKey((k) => k + 1);
    },
    []
  );

  const updateSidebarView = useCallback(
    (view: FilterTabSidebarView) => {
      setSidebarView(view);
      updateSelectedView(null);
    },
    [updateSelectedView]
  );

  const onCloseSelectedView = useCallback(() => updateSelectedView(null), [updateSelectedView]);

  useEscapeHandling(
    sidebarView === FilterTabSidebarView.NewCallView
      ? () => updateSidebarView(FilterTabSidebarView.View)
      : undefined
  );

  const handleOpenClearCallHistoryDialog = useCallback(
    () => setConfirmClearCallHistoryDialogOpen(true),
    []
  );
  const handleCloseClearCallHistoryDialog = useCallback(
    () => setConfirmClearCallHistoryDialogOpen(false),
    []
  );

  const handleOutgoingAudioCall = useCallback(
    (cid: string) => {
      onOutgoingAudioCallInConversation(cid);
      updateSidebarView(FilterTabSidebarView.View);
    },
    [onOutgoingAudioCallInConversation, updateSidebarView]
  );

  const handleOutgoingVideoCall = useCallback(
    (cid: string) => {
      onOutgoingVideoCallInConversation(cid);
      updateSidebarView(FilterTabSidebarView.View);
    },
    [onOutgoingVideoCallInConversation, updateSidebarView]
  );

  useEffect(() => {
    if (selectedView?.type === 'conversation') {
      selectedView.callHistoryGroup?.children.forEach((c) =>
        onMarkCallHistoryRead(selectedView.conversationId, c.callId)
      );
    }
  }, [selectedView, onMarkCallHistoryRead]);

  return (
    <>
      <div className="FilterTab">
        <NavSidebar
          i18n={i18n}
          title={t('icu:FilterTab__HeaderTitle')}
          otherTabsUnreadStats={otherTabsUnreadStats}
          hasFailedStorySends={hasFailedStorySends}
          hasPendingUpdate={hasPendingUpdate}
          navTabsCollapsed={navTabsCollapsed}
          onBack={
            sidebarView === FilterTabSidebarView.NewCallView
              ? () => updateSidebarView(FilterTabSidebarView.View)
              : null
          }
          onToggleNavTabsCollapse={onToggleNavTabsCollapse}
          requiresFullWidth
          preferredLeftPaneWidth={preferredLeftPaneWidth}
          savePreferredLeftPaneWidth={savePreferredLeftPaneWidth}
          renderToastManager={renderToastManager}
          actions={
            sidebarView === FilterTabSidebarView.View && (
              <>
                <NavSidebarActionButton
                  icon={<span className="FilterTab__NewCallActionIcon" />}  
                  label={(k: string) => i18n(k as any, undefined)}
                  onClick={() => updateSidebarView(FilterTabSidebarView.NewCallView)}
                />
                <ContextMenu
                  i18n={i18n}
                  menuOptions={[
                    {
                      icon: 'FilterTab__ClearCallHistoryIcon',
                      label: t('icu:FilterTab__ClearCallHistoryLabel'),
                      onClick: handleOpenClearCallHistoryDialog,
                    },
                  ]}
                  popperOptions={{ placement: 'bottom', strategy: 'absolute' }}
                  portalToRoot
                >
                  {(
                    { onClick, onKeyDown, ref }: {
                      onClick: React.MouseEventHandler<HTMLButtonElement>;
                      onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
                      ref: React.Ref<HTMLButtonElement>;
                    }
                  ) => (
                    <NavSidebarActionButton
                      ref={ref}
                      onClick={onClick}
                      onKeyDown={onKeyDown}
                      icon={<span className="FilterTab__MoreActionsIcon" />}
                      label={t('icu:FilterTab__MoreActionsLabel')}
                    />
                  )}
                </ContextMenu>
              </>
            )
          }
        >
          {sidebarView === FilterTabSidebarView.View && (
            <FilterTabView
              key={FilterTabSidebarView.View}
              activeCall={activeCall}
              getCallHistoryGroupsCount={getCallHistoryGroupsCount}
              getCallHistoryGroups={getCallHistoryGroups}
              callHistoryEdition={callHistoryEdition}
              getAdhocCall={getAdhocCall}
              getCall={getCall}
              getCallLink={getCallLink}
              getConversation={getConversation}
              hangUpActiveCall={hangUpActiveCall}
              i18n={t}
              selectedCallHistoryGroup={selectedView?.callHistoryGroup ?? null}
              onChangeFilterTabSelectedView={updateSelectedView}
              onCreateCallLink={onCreateCallLink}
              onOutgoingAudioCallInConversation={handleOutgoingAudioCall}
              onOutgoingVideoCallInConversation={handleOutgoingVideoCall}
              peekNotConnectedGroupCall={peekNotConnectedGroupCall}
              startCallLinkLobbyByRoomId={startCallLinkLobbyByRoomId}
              toggleConfirmLeaveCallModal={toggleConfirmLeaveCallModal}
              togglePip={togglePip}
            />
          )}
          {sidebarView === FilterTabSidebarView.NewCallView && (
            <CallsNewCall
              key={FilterTabSidebarView.NewCallView}
              hasActiveCall={!!activeCall}
              allConversations={allConversations}
              i18n={i18n}
              regionCode={regionCode}
              onChangeCallsTabSelectedView={updateSelectedView}
              onOutgoingAudioCallInConversation={handleOutgoingAudioCall}
              onOutgoingVideoCallInConversation={handleOutgoingVideoCall}
            />
          )}
        </NavSidebar>

        {selectedView === null ? (
          <div className="FilterTab__EmptyState">
            <div className="FilterTab__EmptyStateIcon" />
            <p className="FilterTab__EmptyStateLabel">
            <p className="FilterTab__EmptyStateLabel">
              {t("icu:FilterTab__EmptyStateText--with-icon-2")}
            </p>
            </p>
          </div>
        ) : (
          <div className="FilterTab__ConversationCallDetails" key={selectedViewKey}>
            {selectedView.type === 'conversation'
              ? renderConversationDetails(selectedView.conversationId, selectedView.callHistoryGroup)
              : renderCallLinkDetails(selectedView.roomId, selectedView.callHistoryGroup, onCloseSelectedView)}
          </div>
        )}
      </div>

      {confirmClearCallHistoryDialogOpen && (
        <ConfirmationDialog
          dialogName="FilterTab__ConfirmClearCallHistory"
          i18n={i18n}
          onClose={handleCloseClearCallHistoryDialog}
          title={t('icu:FilterTab__ConfirmClearCallHistory__Title')}
          actions={[
            {
              style: 'negative',
              text: t('icu:FilterTab__ConfirmClearCallHistory__ConfirmButton'),
              action: onClearCallHistory,
            },
          ]}
        >
          {hasAnyAdminCallLinks
            ? t('icu:FilterTab__ConfirmClearCallHistory__Body--call-links')
            : t('icu:FilterTab__ConfirmClearCallHistory__Body')}
        </ConfirmationDialog>
      )}
    </>
  );
}
