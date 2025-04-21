import React from 'react';

export interface InboxArchiveTabProps {
  i18n: (key: string) => string;
  // add any other props your UI needs
}

/**
 * A stub TSX component for the Inbox / Archive tab.
 * Fill in the JSX to suit your design.
 */
export const InboxArchiveTab: React.FC<InboxArchiveTabProps> = ({ i18n }) => {
  return (
    <div className="left-pane-tab inbox-archive-tab">
      <h2>{i18n('leftPane.inboxArchive.title')}</h2>
      {/* TODO: render list of inbox/archive items here */}
    </div>
  );
};
