// app/left-pane/LeftPaneDialog.tsx

import { LeftPaneMode } from '../constants/LeftPaneMode'; // adjust to your real path
import { SmartFilterTab } from './LeftPaneFilterTab';
import { InboxArchiveTab } from './InboxArchiveTab';
import { MessageRequestsTab } from './MessageRequestsTab';
// … other imports …

export interface LeftPaneDialogProps {
  mode: LeftPaneMode;
  i18n: (key: string) => string;
  // … any other props you already have …
}

export function LeftPaneDialog({
  mode,
  i18n,
  // … rest of your props …
}: LeftPaneDialogProps) {
  switch (mode) {
    case LeftPaneMode.INBOX_ARCHIVE:
      return <InboxArchiveTab i18n={i18n} /* …other props… */ />;
  
    case LeftPaneMode.MESSAGE_REQUESTS:
      return <MessageRequestsTab i18n={i18n} /* …other props… */ />;

    // ← your new filter case goes here
    case LeftPaneMode.FILTER:
      return (
        <SmartFilterTab
          i18n={i18n}
          // … pass any other props SmartFilterTab needs …
        />
      );

    // … other cases …

    default:
      return null;
  }
}
