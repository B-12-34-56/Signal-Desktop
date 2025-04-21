// Add this to the existing LeftPane.ts file

// Add FILTER to the LeftPaneMode enum
export enum LeftPaneMode {
  // ... existing modes
  INBOX_ARCHIVE = 0,
  MESSAGE_REQUESTS = 1,
  COMPOSE = 2,
  CONVERSATIONS = 3,
  CONTACTS = 4,
  FILTER = 5, // Add this line
}
