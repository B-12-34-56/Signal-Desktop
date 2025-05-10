import React from 'react';

export interface MessageRequestsTabProps {
  i18n: (key: string) => string;
  // add any other props your UI needs
}

/**
 * A stub TSX component for the Message Requests tab.
 * Extend this with your actual data fetching & presentation.
 */
export const MessageRequestsTab: React.FC<MessageRequestsTabProps> = ({ i18n }) => {
  return (
    <div className="left-pane-tab message-requests-tab">
      <h2>{i18n('leftPane.messageRequests.title')}</h2>
      {/* TODO: render incoming message requests here */}
    </div>
  );
};
